package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"time"
)

func main() {
	// Define a command-line flag for the port
	port := flag.String("port", "8081", "Port to listen on")
	flag.Parse()

	// Create a file server handler serving from the current directory
	fs := http.FileServer(http.Dir("."))

	// Handle all requests with our logging middleware wrapped around the file server
	http.Handle("/", noCacheHandler(logRequests(fs)))

	// Print a message indicating on which port the server will listen
	log.Printf("Starting server on port %s\n", *port)

	// Start the server
	err := http.ListenAndServe(":"+*port, nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// logRequests is a middleware that logs the method, path, and remote address
// for each incoming HTTP request
func logRequests(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		timestamp := time.Now().Format("2006-01-02 15:04:05")
		fmt.Printf("[%s] %s %s\n", timestamp, r.Method, r.URL.Path)
		handler.ServeHTTP(w, r)
	})
}

// noCacheHandler wraps an http.Handler to set headers to prevent caching.
func noCacheHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		w.Header().Set("Pragma", "no-cache")
		w.Header().Set("Expires", "0")
		next.ServeHTTP(w, r)
	})
}
