package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// List of allowed origins
		allowedOrigins := map[string]bool{
			"https://www.thesimonkim.com": true,
			"https://thesimonkim.com":     true,
			"http://localhost:3000":       true, // Allow localhost for development
		}

		// Set headers for allowed origins
		if _, exists := allowedOrigins[origin]; exists {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")
		}

		// Handle preflight OPTIONS request
		if c.Request.Method == "OPTIONS" {
			if _, exists := allowedOrigins[origin]; exists {
				c.AbortWithStatus(http.StatusNoContent)
			} else {
				c.AbortWithStatus(http.StatusForbidden)
			}
			return
		}

		c.Next()
	}
}

func main() {
	router := gin.Default()
	router.Use(CORSMiddleware())
	apiroute := router.Group("/api")
	{
		apiroute.GET("/message", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Lets Test one last time if the deployment automation is successful: This is a message from the backend.",
			})
		})
	}

	router.Run(":18080")
}
