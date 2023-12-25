package main

import (
	"fmt"
	"strings"
	"testing"

	"golang.org/x/tools/txtar"
)

func formatBytes(str string) string {
	lines := strings.Split(str, "\n")
	output := ""
	for _, line := range lines {
		output = fmt.Sprintf("%s%-24s %v\n", output, line, []byte(line))
	}
	return output
}

func TestParser(t *testing.T) {
	archive, err := txtar.ParseFile("testcases.txt")
	if err != nil {
		t.Log(err)
		t.Fail()
	}
	for _, f := range archive.Files {
		if f.Name != "test-do-continue.asm" {
			continue
		}
		if !strings.HasSuffix(f.Name, ".asm") {
			continue
		}
		inputContent := strings.TrimSpace(string(f.Data))
		outputFilename := fmt.Sprintf("%s.output", f.Name)
		var outputFile *txtar.File
		for _, g := range archive.Files {
			if g.Name == outputFilename {
				outputFile = &g
				break
			}
		}
		if outputFile == nil {
			t.Logf("txtar file not found: %s", outputFilename)
			t.FailNow()
		}
		t.Run(f.Name, func(t *testing.T) {
			if strings.HasPrefix(inputContent, "@disabled") {
				note, _, _ := strings.Cut(inputContent, "\n")
				t.Skipf(note)
			}

			tokens, err := tokenize(inputContent)
			if err != nil {
				t.Log(err)
				t.Fail()
			}

			parser := NewParser(tokens)
			nodes, err := parser.parse()
			if err != nil {
				t.Log(err)
				t.Fail()
			}
			optimized, _ := optimize(nodes)

			originalOutput := strings.TrimSpace(serialize(nodes))
			optimizedOutput := strings.TrimSpace(serialize(optimized))

			want := strings.TrimSpace(string(outputFile.Data))
			got := optimizedOutput
			if want != got {
				wantFormatted := formatBytes(want)
				gotFormatted := formatBytes(got)

				wantLines := strings.Split(wantFormatted, "\n")
				gotLines := strings.Split(gotFormatted, "\n")

				mismatch := -1
				for i := 0; i < len(wantLines) && i < len(gotLines); i++ {
					if gotLines[i] != wantLines[i] {
						mismatch = i
						break
					}
				}
				for i := 0; i < len(wantLines); i++ {
					if i == mismatch {
						wantLines[i] = fmt.Sprintf("%2d > %s", i+1, wantLines[i])
					} else {
						wantLines[i] = fmt.Sprintf("%2d   %s", i+1, wantLines[i])
					}
				}
				for i := 0; i < len(gotLines); i++ {
					if i == mismatch {
						gotLines[i] = fmt.Sprintf("%2d > %s", i+1, gotLines[i])
					} else {
						gotLines[i] = fmt.Sprintf("%2d   %s", i+1, gotLines[i])
					}
				}

				wantFormatted = strings.Join(wantLines, "\n")
				gotFormatted = strings.Join(gotLines, "\n")

				// t.Log(nodes)
				// t.Log(optimized)
				t.Logf("want:\n%s\n\ngot:\n%s\n\nUnformatted:\n%s\n\nUnoptimized:\n%s\n", wantFormatted, gotFormatted, got, originalOutput)
				t.Fail()
			}
		})
	}
}
