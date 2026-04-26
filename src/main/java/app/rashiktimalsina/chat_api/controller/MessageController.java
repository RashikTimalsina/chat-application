package app.rashiktimalsina.chat_api.controller;

import app.rashiktimalsina.chat_api.document.Message;
import app.rashiktimalsina.chat_api.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * @author RashikTimalsina
 * @created 23/04/2026
 */

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;


    @PostMapping
    public Mono<Message> sendMessage(@RequestBody Message message) {
        return messageService.sendMessage(message);
    }


    @GetMapping("/{groupId}")
    public Flux<Message> getAllMessages(@PathVariable String groupId) {
        return messageService.getGroupMessages(groupId);
    }

    @GetMapping
    public Flux<Message> getAllMessages(){
        return messageService.getAllMessages();
    }


}
