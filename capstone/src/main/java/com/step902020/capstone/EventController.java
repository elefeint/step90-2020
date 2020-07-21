package com.step902020.capstone;

import java.io.IOException;
import java.util.*;
import java.time.LocalDateTime;

import com.step902020.capstone.security.CurrentUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;
import java.time.LocalDateTime;
import java.lang.Double;

import java.io.IOException;

/**
 * Event functionalities
 *   - Add new reviews
 *   - List reviews
 * TODO: filtering, creating event with front end input
 */
 
@RestController
public class EventController {

  @Autowired
  private EventRepository eventRepository;

  @Autowired
  private IndividualRepository individualRepository;

  @Autowired
  private OrganizationRepository organizationRepository;

  @GetMapping("get-all-events")
  public Iterable<Event> getAllEvents() {
    return this.eventRepository.findAll();
  }

  @GetMapping("get-event")
  public Event getEvent(@RequestParam("event-id") String eventId) throws IOException {
    Event event = this.eventRepository.findById(Long.parseLong(eventId)).orElse(null);
    return event;
  }

  @PostMapping("save-event")
  public RedirectView saveEvent (
     CurrentUser user,
     @RequestParam("eventTitle") String eventTitle,
     @RequestParam("eventDateTime") String eventDateTime,
     @RequestParam("eventDescription") String eventDescription,
     @RequestParam("eventLatitude") String eventLatitude,
     @RequestParam("eventLongitude") String eventLongitude,
     @RequestParam("foodAvailable") Optional<Boolean> foodAvailable,
     @RequestParam("requiredFee") Optional<Boolean> requiredFee,
     @RequestParam("event-id") String eventId
    ) throws IOException {
      Organization organization = organizationRepository.findFirstByEmail(user.getEmail());
      Event event = eventId.length() <= 0? null : this.eventRepository.findById(Long.parseLong(eventId)).orElse(null);
      if (event != null) {
        event.setEventDateTime(eventDateTime);
        event.setEventDescription(eventDescription);
        event.setEventLatitude(Double.parseDouble(eventLatitude));
        event.setEventLongitude(Double.parseDouble(eventLongitude));
        event.setEventTitle(eventTitle);
        this.eventRepository.save(event);
      } else {
        Event newEvent = new Event(organization.getName(), organization.getDatastoreId(), eventTitle, eventDateTime,
                eventDescription, Double.parseDouble(eventLatitude), Double.parseDouble(eventLongitude),
                foodAvailable.orElse(false), requiredFee.orElse(false));
        this.eventRepository.save(newEvent);
        organization.addEvent(newEvent);
        this.organizationRepository.save(organization);
      }
      return new RedirectView("manageevents.html", true);
  }

  /**
   * Add new review to event
   * @param user current user
   * @param eventId Event's datastore id
   * @param text Review's text
   * @return Updated review list
   */
  @PostMapping("/new-review")
  public List<Review> addReview(
          CurrentUser user,
          @RequestParam("text") String text,
          @RequestParam("eventId") Long eventId) throws IOException {

    Event event = this.eventRepository.findById(eventId).get();
    Individual individual = this.individualRepository.findFirstByEmail(user.getEmail());
    String individualName = individual.firstName + " " + individual.lastName;
    String individualEmail = individual.email;
    Review review = new Review(individualName, individualEmail, text);
    event.addReview(review);
    this.eventRepository.save(event);
    return event.reviews;
  }
}
