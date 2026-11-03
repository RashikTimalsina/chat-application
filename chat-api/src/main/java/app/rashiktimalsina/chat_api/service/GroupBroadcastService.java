package app.rashiktimalsina.chat_api.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Sinks;
import reactor.util.concurrent.Queues;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Owns the per-group in-memory broadcast sinks, shared by both the WebSocket
 * handler (inbound chat frames) and the REST controller (POST /api/messages),
 * so a message saved through either path reaches every connected client.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GroupBroadcastService {

    private final ObjectMapper objectMapper;
    private final Map<String, Sinks.Many<String>> groupSinks = new ConcurrentHashMap<>();

    public Sinks.Many<String> sinkFor(String groupId) {
        // autoCancel=false: the sink must survive its subscriber count
        // dropping to zero (e.g. the only member in a group refreshes their
        // tab), otherwise it terminates and never delivers to anyone who
        // reconnects to this same group afterward.
        return groupSinks.computeIfAbsent(
                groupId,
                id -> Sinks.many().multicast().onBackpressureBuffer(Queues.SMALL_BUFFER_SIZE, false)
        );
    }

    public void broadcast(String groupId, Object payload) {
        sinkFor(groupId).tryEmitNext(toJson(payload));
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException e) {
            log.error("Failed to serialize payload: {}", e.getMessage());
            return "{}";
        }
    }
}
