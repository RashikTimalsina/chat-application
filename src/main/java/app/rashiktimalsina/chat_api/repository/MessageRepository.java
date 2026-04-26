package app.rashiktimalsina.chat_api.repository;

import app.rashiktimalsina.chat_api.document.Message;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

/**
 * @author RashikTimalsina
 * @created 23/04/2026
 */

@Repository
public interface MessageRepository extends ReactiveMongoRepository<Message, String> {
        Flux<Message> findByGroupId(String groupId);
}
