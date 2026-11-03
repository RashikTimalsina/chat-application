package app.rashiktimalsina.chat_api.service;

import app.rashiktimalsina.chat_api.document.Message;
import app.rashiktimalsina.chat_api.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * @author RashikTimalsina
 * @created 23/04/2026
 */

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final GroupBroadcastService broadcastService;

    public Mono<Message> sendMessage(Message message) {
        return messageRepository.save(message)
                .doOnNext(saved -> broadcastService.broadcast(saved.getGroupId(), saved));
    }

    public Flux<Message> getGroupMessages(String groupId) {
        return messageRepository.findByGroupId(groupId);
    }

    public Flux<Message> getAllMessages() {
        return messageRepository.findAll();
    }


}
