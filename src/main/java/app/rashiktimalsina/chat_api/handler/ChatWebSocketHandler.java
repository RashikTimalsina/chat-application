package app.rashiktimalsina.chat_api.handler;

import app.rashiktimalsina.chat_api.document.Message;
import app.rashiktimalsina.chat_api.repository.MessageRepository;
import tools.jackson.core.JacksonException;        // ✅ Jackson 3.x
import tools.jackson.databind.ObjectMapper;         // ✅ Jackson 3.x
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
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler implements WebSocketHandler {

    private final MessageRepository messageRepository;
    private final ObjectMapper objectMapper;

    private final Map<String, Sinks.Many<Message>> groupSinks = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String path = session.getHandshakeInfo().getUri().getPath();
        String groupId = path.substring(path.lastIndexOf('/') + 1);

        log.debug("WebSocket connected: sessionId={}, groupId={}", session.getId(), groupId);

        Sinks.Many<Message> sink = groupSinks.computeIfAbsent(
                groupId,
                id -> Sinks.many().multicast().onBackpressureBuffer()
        );

        Mono<Void> inbound = session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .flatMap(payload -> deserialize(payload, groupId))
                .flatMap(messageRepository::save)
                .doOnNext(saved -> {
                    log.debug("Message saved and broadcasting: {}", saved.getId());
                    sink.tryEmitNext(saved);
                })
                .doOnError(err -> log.error("Inbound error: {}", err.getMessage()))
                .then();

        Flux<WebSocketMessage> outbound = sink.asFlux()
                .map(msg -> serialize(session, msg))
                .doOnError(err -> log.error("Outbound error: {}", err.getMessage()));

        return session.send(outbound).mergeWith(inbound).then()
                .doFinally(signal -> log.debug("WebSocket disconnected: sessionId={}", session.getId()));
    }

    private Mono<Message> deserialize(String payload, String groupId) {
        try {
            Message message = objectMapper.readValue(payload, Message.class);
            message.setGroupId(groupId);
            return Mono.just(message);
        } catch (JacksonException e) {
            log.error("Failed to deserialize message payload: {}", e.getMessage());
            return Mono.empty();
        }
    }

    private WebSocketMessage serialize(WebSocketSession session, Message message) {
        try {
            return session.textMessage(objectMapper.writeValueAsString(message));
        } catch (JacksonException e) {
            log.error("Failed to serialize message: {}", e.getMessage());
            return session.textMessage("{}");
        }
    }
}