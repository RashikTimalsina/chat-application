package app.rashiktimalsina.chat_api.handler;

import app.rashiktimalsina.chat_api.document.Message;
import app.rashiktimalsina.chat_api.repository.MessageRepository;
import app.rashiktimalsina.chat_api.service.GroupBroadcastService;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler implements WebSocketHandler {

    private final MessageRepository messageRepository;
    private final ObjectMapper objectMapper;
    private final GroupBroadcastService broadcastService;

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String path = session.getHandshakeInfo().getUri().getPath();
        String groupId = path.substring(path.lastIndexOf('/') + 1);

        log.debug("WebSocket connected: sessionId={}, groupId={}", session.getId(), groupId);

        Sinks.Many<String> sink = broadcastService.sinkFor(groupId);

        Mono<Void> inbound = session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .flatMap(payload -> handleIncoming(payload, groupId))
                .doOnError(err -> log.error("Inbound error: {}", err.getMessage()))
                .then();

        Flux<WebSocketMessage> outbound = sink.asFlux()
                .map(session::textMessage)
                .doOnError(err -> log.error("Outbound error: {}", err.getMessage()));

        return session.send(outbound).mergeWith(inbound).then()
                .doFinally(signal -> log.debug("WebSocket disconnected: sessionId={}", session.getId()));
    }

    // Typing pings carry no message content and must never be persisted or
    // treated as a Message; only real chat frames go to Mongo.
    private Mono<Void> handleIncoming(String payload, String groupId) {
        Map<?, ?> raw;
        try {
            raw = objectMapper.readValue(payload, Map.class);
        } catch (JacksonException e) {
            log.error("Failed to parse payload: {}", e.getMessage());
            return Mono.empty();
        }

        if ("typing".equals(raw.get("type"))) {
            broadcastService.broadcast(groupId, new TypingEvent("typing", String.valueOf(raw.get("sender")), groupId));
            return Mono.empty();
        }

        Message message;
        try {
            message = objectMapper.readValue(payload, Message.class);
        } catch (JacksonException e) {
            log.error("Failed to deserialize message payload: {}", e.getMessage());
            return Mono.empty();
        }
        message.setGroupId(groupId);

        return messageRepository.save(message)
                .doOnNext(saved -> {
                    log.debug("Message saved and broadcasting: {}", saved.getId());
                    broadcastService.broadcast(groupId, saved);
                })
                .then();
    }

    private record TypingEvent(String type, String sender, String groupId) {}
}
