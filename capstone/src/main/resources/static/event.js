/**
 * Retrieves events from server if current user has a profile
 */
function getEvents() {
  fetch('user-info').then(response => response.json()).then((data) => {
    if (data.userType != "unknown") {
      loadEvents(data);
    } else { // no profile
      displayMain(false);
    }
  });
}

/**
 * Loads events if user has a profile
 * @param Current user data
 */
function loadEvents(data) {
  var isIndividual = data.userType == "individual";
  fetch('get-all-events').then(response => response.json()).then((events) => {
    const eventListElement = setElementInnerText('events', ''); // Clear elements in div
    events.forEach((event) => {
      createEventElement(eventListElement, event, isIndividual, data.email);
    })
  });
}

/**
 * Create a formatted list of events
 * @param eventListElement DOM element to append
 * @param event Event from Get call
 * @param isIndividual If user is an individual user
 * @param userEmail Current user's email
 */
function createEventElement(eventListElement, event, isIndividual, userEmail) {
  const eventElement = createElement(eventListElement, 'li', '');
  eventElement.className = 'event';

  // Click for event detail modal
  eventElement.addEventListener('click', () => {
    showEventPage(event, isIndividual, userEmail);
  });

  // Name
  createElement(eventElement, 'p', event.eventTitle);

  // Time
  var date = new Date(event.eventDateTime);
  createElement(eventElement, 'p', date.toString().substring(0, 21)); // Exclude GMT time zone offset

  // Location Using latitude as a filler until we finalize the location portion
  createElement(eventElement, 'p', event.eventLatitude);

  // Organization
  createElement(eventElement, 'p', event.organizationName);

  // Only for individual users can save events
  if (isIndividual) {
    createSaveEventButton(eventElement, event);
  }
}

/**
 * Create event's review submission elements and formats review listing
 * Only individuals will see review submission option
 * @param event An event object
 * @param isIndividual If user is an individual user
 * @param userEmail Current user's email
 */
function createReviewElement(event, isIndividual, userEmail) {
  const reviewElement = document.getElementById('review-container');
  const reviewTitleElement = createElement(reviewElement, 'h1', 'Reviews');

  if (isIndividual) {
    const reviewInputElement = createElement(reviewElement, 'input', '');
    reviewInputElement.className = 'review-submission';
    reviewInputElement.setAttribute('placeholder', 'Leave a review');
    reviewInputElement.setAttribute('type', 'text');

    reviewButtonElement = createElement(reviewElement, 'button', 'Submit');
    reviewButtonElement.className = 'review-submission';

    reviewButtonElement.addEventListener('click', () => {
      if (reviewInputElement.value != '') {
        newReview(event.datastoreId, reviewInputElement.value).then((reviews) => {
          reviewsContainer.innerHTML = '';
          createReviewContainerElement(reviewsContainer, reviews, userEmail);
        });
      }
    });
  }
  const reviewsContainer = createElement(reviewElement, 'div', '');
  reviewsContainer.id = 'review-list-container';
  createReviewContainerElement(reviewsContainer, event.reviews, userEmail);
}

/**
 * Formats each review to add to review container
 * Users can like each review once
 * Individuals can edit/delete their reviews
 * @param reviewsContainer Container to hold an event's review list
 * @param reviews List of reviews within Event object
 * @param userEmail Current user's email
 */
function createReviewContainerElement(reviewsContainer, reviews, userEmail) {
  reviews.forEach((review) => {
    const reviewContainer = createElement(reviewsContainer, 'div', '');
    reviewContainer.className = 'review';

    const reviewDetailsElement = createElement(reviewContainer, 'div', '');
    reviewDetailsElement.className = 'review-details';

    createElement(reviewDetailsElement, 'p', review.individualName);

    const reviewTimeElement = createElement(reviewDetailsElement, 'time', '');
    reviewTimeElement.className = 'timeago';
    reviewTimeElement.setAttribute('datetime', review.timestamp);

    const reviewTextElement = createElement(reviewContainer, 'p', review.text);
    reviewTextElement.className = 'review-text';

    const reviewLikeElement = createElement(reviewContainer, 'button',  review.likes + ' Likes');
    reviewLikeElement.addEventListener('click', () => {
      likeReview(review.datastoreId).then((reviewLikes) => {
        reviewLikeElement.innerText = reviewLikes + ' Likes';
      });
    });

    if (review.individualEmail == userEmail) {
      reviewAuthorFeatures(reviewContainer, reviewTextElement, review.datastoreId);
    }
  })
}

/**
 * Add delete and edit functionality for review's author
 * @param reviewContainer Review's container
 * @param reviewTextElement Container for review's text
 * @param reviewId Review's datastore id
 */
function reviewAuthorFeatures(reviewContainer, reviewTextElement, reviewId) {
  const deleteButton = createElement(reviewContainer, 'button', 'Delete');
  deleteButton.addEventListener('click', () => {
    deleteReview(reviewId);
    reviewContainer.remove();
  });

  const editButton = createElement(reviewContainer, 'button', 'Edit');
  editButton.addEventListener('click', () => {
    if (editButton.innerText == 'Edit') {
      reviewTextElement.contentEditable = true;
      reviewTextElement.focus();
      editButton.innerText = 'Done';
    } else {
      setReviewText(reviewId, reviewTextElement.innerText);
      reviewTextElement.contentEditable = false;
      editButton.innerText = 'Edit';
    }
  });
}

/**
 * Create new review to add to event's list
 * @param eventId Event's datastoreId
 * @param text Text content of Review
 * @return Update list of reviews
 */
async function newReview(eventId, text) {
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('eventId', eventId);
  const response = await fetch('new-review', {method:'POST', body: params});
  const reviews = response.json();
  getEvents();
  return reviews;
}

/**
 * Remove a review from event's list
 * @param reviewId Review to remove's datastoreId
 */
function deleteReview(reviewId) {
  const params = new URLSearchParams();
  params.append('reviewId', reviewId);
  fetch('delete-review', {method:'POST', body: params});
  getEvents();
}

/**
 * Add to review's like count
 * @param reviewId Review's datastoreId
 * @return Updated like count
 */
async function likeReview(reviewId) {
  const params = new URLSearchParams();
  params.append('reviewId', reviewId);
  const response = await fetch('review-likes', {method:'POST', body: params});
  const value = response.json();
  getEvents();
  return value;
}

/**
 * Set review's text to author's entered text
 * @param reviewId Review's datastore id
 * @param newText Text to replace prev review's text
 */
function setReviewText(reviewId, newText) {
  const params = new URLSearchParams();
  params.append('newText', newText);
  params.append('reviewId', reviewId);
  fetch('set-text', {method:'POST', body: params});
  getEvents();
}

/* Function to prefill event information if editing event */
function loadEventInfo() {
  const event = window.location.hash.substring(1);
  if (event != "") {
    fetch('get-event?event-id=' + event).then(response => response.json()).then((data) => {
      document.getElementById("eventTitle").value = data.eventTitle;
      document.getElementById("eventDateTime").value = data.eventDateTime;
      document.getElementById("eventLatitude").value = data.eventLatitude;
      document.getElementById("eventLongitude").value = data.eventLongitude;
      document.getElementById("eventDescription").value = data.description;
      document.getElementById("event-id").value = data.datastoreId;
    });
  }
}

/* Function to create Google Map */
async function createMap() {
  var princetonLatLng = {lat: 40.3428452, lng: -74.6568153};
  const campusMap = new google.maps.Map(
    document.getElementById('map'),
    {center: princetonLatLng, zoom: 16});

   const response = await fetch('get-all-events');
   const jsonEvents = await response.json();
   jsonEvents.forEach(event => createMarker(event, campusMap));
}

/* Create a new marker for each event
 * @param event - event object
 * @param campusMap - Google Map object
 */
function createMarker(event,campusMap) {
  var eventPosition = {lat: event.eventLatitude, lng: event.eventLongitude};
  const newMarker = new google.maps.Marker({
    map: campusMap,
    title: event.eventTitle,
    position: eventPosition
  })
}
  
/**
 * Create a page to view event details
 * @param eventId event's datastore id
 */
function fillDetails(event) {
  var date = new Date(event.eventDateTime);

  setElementInnerText("eventTitle", event.eventTitle);
  setElementInnerText("eventTime", date.toString().substring(0, 21)); // Exclude GMT time zone offset
  setElementInnerText("eventLocation", event.eventLatitude);
  setElementInnerText("eventOrganization", event.organizationName);
  setElementInnerText("eventDescription", event.eventDescription);
}

/**
 * Fill an existing document element's inner text
 * @param elementId document element's id
 * @param innerText text for inner text
 * @return element with added text
 */
function setElementInnerText(elementId, innerText){
  const element = document.getElementById(elementId);
  element.innerText = innerText;
  return element;
}

/**
 * Create new element with inner text and appended to an element
 * @param elementElement element to append
 * @param elementType element to create
 * @param innerText text for inner text
 * @return created element
 */
function createElement(appendElement, elementType, innerText){
  const element = document.createElement(elementType);
  element.innerText = innerText;
  appendElement.appendChild(element);
  return element;
}

/**
 * Create a page to view event details
 * @param eventId event's datastore id
 * @param isIndividual if current user is an individual user
 * @param userEmail current user's email
 */
function showEventPage(event, isIndividual, userEmail) {
  fillDetails(event);
  const modal = document.getElementById('modal');
  modal.style.display = 'block';

  const reviewContainer = document.getElementById("review-container");
  reviewContainer.innerHTML = '';
  createReviewElement(event, isIndividual, userEmail);

  if (event.reviews.length) { // Format time to *** time ago
    timeago.render(document.querySelectorAll('.timeago'));
  }

}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target == modal) {
    modal.style.display = "none";
  }
}