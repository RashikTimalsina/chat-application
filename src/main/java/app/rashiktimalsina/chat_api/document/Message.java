package app.rashiktimalsina.chat_api.document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * @author RashikTimalsina
 * @created 23/04/2026
 */
@Document(collection = "messages")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Message {

    @Id
    private String id;

    private String sender;

    private String groupId;

    private String content;

    @CreatedDate
    private Instant timestamp;



}
