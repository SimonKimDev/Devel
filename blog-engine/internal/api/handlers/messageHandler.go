package handlers

import (
	"net/http"
)

// Message is what the site's "Click This" button shows.
const Message = "Lets Test one last time if the deployment automation is successful: This is a message from the backend."

type MessageResponse struct {
	Message string `json:"message"`
}

func GetMessage(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, MessageResponse{Message: Message})
}
