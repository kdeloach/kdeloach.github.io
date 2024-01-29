package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"time"

	"github.com/sashabaranov/go-openai"
)

// Manually created sprite sheet from DOM screenshot. The sprite sheet
// dimensions are 480x2736. Sprite dimensions are 48x48.
const SPRITE_SHEET = "yoto-sprites-480.png"
const SPRITE_SIZE = 48

var client *openai.Client

func main() {
	apiKey := os.Getenv("OPENAI_KEY")
	client = openai.NewClient(apiKey)

	// generateSprites()

	spriteSheetFile, err := os.Open(SPRITE_SHEET)
	if err != nil {
		fmt.Println("Error opening image file:", err)
		return
	}
	defer spriteSheetFile.Close()

	spriteSheetImage, _, err := image.Decode(spriteSheetFile)
	if err != nil {
		fmt.Println("Error decoding image file:", err)
		return
	}

	rgba, ok := spriteSheetImage.(*image.RGBA)
	if !ok {
		fmt.Println("Sprite sheet should be in RGBA format")
		return
	}

	ctx := context.Background()
	// describeAll(ctx, rgba)
	// describe(ctx, rgba, 7, 1)
	describe(ctx, rgba, 3, 1)
}

// describeAll calls describe for all sprites.
func describeAll(ctx context.Context, rgba *image.RGBA) {
	for y := 0; y < 57; y++ {
		for x := 0; x < 10; x++ {
			if y == 56 && x == 5 {
				return
			}
			err := describe(ctx, rgba, x, y)
			if err != nil {
				fmt.Printf("Error describing image: %s\n", err)
			}
			time.Sleep(1 * time.Second)
		}
	}
}

// describe describes a single sprite and saves the output to a text file.
func describe(ctx context.Context, rgba *image.RGBA, x, y int) error {
	content, err := describeImage(ctx, rgba, x, y)
	if err != nil {
		fmt.Printf("Error describing image: %s\n", err)
		content = fmt.Sprintf("error: %s", err)
	}

	content = fmt.Sprintf("%d,%d,%s", x, y, content)

	// XXX
	fmt.Println(content)
	return nil

	// Create or open the file for writing (truncate it if it exists)
	file, err := os.Create(fmt.Sprintf("sprite_%d_%d.txt", y, x))
	if err != nil {
		return fmt.Errorf("Error creating file: %w", err)
	}
	defer file.Close()

	// Write the string to the file
	_, err = fmt.Fprintln(file, content)
	if err != nil {
		return fmt.Errorf("Error writing to file: %w", err)
	}

	return nil
}

// generateSprites generates individual image files from sprite sheet.
func generateSprites() {
	// Manually created sprite sheet from DOM screenshot. The sprite sheet
	// dimensions are 480x2736. Sprite dimensions are 48x48.
	spriteSheetFile, err := os.Open(SPRITE_SHEET)
	if err != nil {
		fmt.Println("Error opening image file:", err)
		return
	}
	defer spriteSheetFile.Close()

	spriteSheetImage, _, err := image.Decode(spriteSheetFile)
	if err != nil {
		fmt.Println("Error decoding image file:", err)
		return
	}

	rgba, ok := spriteSheetImage.(*image.RGBA)
	if !ok {
		fmt.Println("Sprite sheet should be in RGBA format")
		return
	}

	for y := 0; y < 57; y++ {
		for x := 0; x < 10; x++ {
			if y == 56 && x == 5 {
				return
			}

			py := y * SPRITE_SIZE
			px := x * SPRITE_SIZE

			// Create a new image for the sprite
			sprite := image.NewRGBA(image.Rect(0, 0, SPRITE_SIZE, SPRITE_SIZE))

			// Copy the pixels from the sprite sheet to the sprite
			for i := 0; i < SPRITE_SIZE; i++ {
				for j := 0; j < SPRITE_SIZE; j++ {
					r, g, b, a := rgba.At(px+j, py+i).RGBA()
					sprite.Set(j, i, color.RGBA{uint8(r), uint8(g), uint8(b), uint8(a)})
				}
			}

			// Save the sprite as an individual PNG file
			spriteFileName := fmt.Sprintf("img/sprite_%d_%d.png", y, x)
			spriteFile, err := os.Create(spriteFileName)
			if err != nil {
				fmt.Printf("Error creating sprite file %s: %v\n", spriteFileName, err)
				return
			}
			defer spriteFile.Close()

			err = png.Encode(spriteFile, sprite)
			if err != nil {
				fmt.Printf("Error encoding sprite file %s: %v\n", spriteFileName, err)
				return
			}
		}
	}
}

// describeImage asks OpenAI GPT-4 to describe attached image.
func describeImage(ctx context.Context, rgba *image.RGBA, x, y int) (string, error) {
	py := y * SPRITE_SIZE
	px := x * SPRITE_SIZE

	sprite := image.NewRGBA(image.Rect(0, 0, SPRITE_SIZE, SPRITE_SIZE))

	// Copy the pixels from the sprite sheet to the sprite
	for i := 0; i < SPRITE_SIZE; i++ {
		for j := 0; j < SPRITE_SIZE; j++ {
			r, g, b, a := rgba.At(px+j, py+i).RGBA()
			sprite.Set(j, i, color.RGBA{uint8(r), uint8(g), uint8(b), uint8(a)})
		}
	}

	var b bytes.Buffer
	err := png.Encode(&b, sprite)
	if err != nil {
		return "", fmt.Errorf("Error encoding sprite: %w\n", err)
	}

	base64Encoded := base64.StdEncoding.EncodeToString(b.Bytes())

	resp, err := client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			MaxTokens: 500,
			Model:     openai.GPT4VisionPreview,
			Messages: []openai.ChatCompletionMessage{
				{
					Role: openai.ChatMessageRoleUser,
					MultiContent: []openai.ChatMessagePart{
						{
							Type: openai.ChatMessagePartTypeText,
							Text: "Describe this image as a list of words separated by comma. Be as detailed and specific as possible. Focus on the object of the image as a whole. Exclude words describing the background or art style (ex. 'pixelated', 'pixel', '8-bit', 'abstract', 'minimal', 'simplistic', 'avatar'). Include words describing sentiment, emotion, color, and tone. Prefer formatting like '5' instead of 'five'. Don't repeat words. Limit response to 20 words.",
						},
						{
							Type: openai.ChatMessagePartTypeImageURL,
							ImageURL: &openai.ChatMessageImageURL{
								URL: "data:image/png;base64," + base64Encoded,
							},
						},
					},
				},
			},
		},
	)

	if err != nil {
		return "", fmt.Errorf("ChatCompletion error: %w", err)
	}

	return resp.Choices[0].Message.Content, nil
}
