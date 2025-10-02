package main

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"text/template"
	"time"

	"log"

	"github.com/gomarkdown/markdown"
	"github.com/gomarkdown/markdown/html"
	"github.com/gomarkdown/markdown/parser"
	"gopkg.in/yaml.v2"
)

type Site struct {
	Title       string
	Author      string
	Description string
	URL         string
	PubDate     time.Time
	LastBuild   time.Time
	GitSHA      string

	Pages      []*Page
	PagesByTag map[string][]*Page
}

type Page struct {
	// File info
	Path string
	Dir  string

	// YAML content
	*Frontmatter
	Markdown string

	// Calculated fields
	Content    string
	URL        string
	OutputFile string

	// Reference to Site for convenient access in templates
	Site *Site
}

type Frontmatter struct {
	Title     string    `yaml:"title"`
	Summary   string    `yaml:"summary"`
	Date      time.Time `yaml:"date"`
	Templates []string  `yaml:"templates"`
	Tags      []string  `yaml:"tags"`
	Output    string    `yaml:"output"`
}

func main() {
	rootDir := "."
	if len(os.Args) > 1 {
		rootDir = os.Args[1]
	}

	siteURL, err := url.Parse("https://kdeloach.me")
	if err != nil {
		log.Printf("error parsing URL: %s", err)
		return
	}

	gitSHA, err := getCurrentGitSHA(rootDir)
	if err != nil {
		log.Printf("error getting git SHA: %s", err)
		return
	}

	site := &Site{}
	site.Pages = []*Page{}
	site.PagesByTag = map[string][]*Page{}

	// TODO: Move to site settings file
	site.Title = "Kevin DeLoach"
	site.Author = "Kevin DeLoach"
	site.Description = "Full Stack Software Engineer, Philadelphia, PA"
	site.URL = siteURL.String()
	site.PubDate = time.Date(2021, time.December, 30, 12, 0, 0, 0, time.UTC) // Datecalc post publish date (first post)
	site.LastBuild = time.Now().UTC()
	site.GitSHA = gitSHA

	processMarkdownFile := func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return fmt.Errorf("Error accessing file %s: %w", path, err)
		}

		if info.IsDir() && strings.Contains(path, "node_modules") {
			return filepath.SkipDir
		}

		if !info.IsDir() && strings.HasSuffix(path, ".md") {
			content, err := ioutil.ReadFile(path)
			if err != nil {
				return fmt.Errorf("Error reading file %s: %w", path, err)
			}

			parts := strings.SplitN(string(content), "---", 3)
			if len(parts) < 3 {
				log.Printf("Warning: Skipping file %s: No valid frontmatter found", path)
				return nil
			}

			var frontmatter Frontmatter
			if err := yaml.Unmarshal([]byte(parts[1]), &frontmatter); err != nil {
				log.Printf("Warning: Error parsing YAML in file %s: %v", path, err)
				return nil
			}

			baseName := filepath.Base(path)                                          // index.html
			withoutExtension := strings.TrimSuffix(baseName, filepath.Ext(baseName)) // index
			outputFile := fmt.Sprintf("%s.%s", withoutExtension, "html")             // index.md

			// Check frontmatter for custom filename
			if frontmatter.Output != "" {
				outputFile = frontmatter.Output
			}

			baseDir := filepath.Dir(path)                    // ./rings
			outputPath := filepath.Join(baseDir, outputFile) // ./rings/index.md

			relPath, err := filepath.Rel(rootDir, outputPath)
			if err != nil {
				return err
			}

			// omit index.html from path if present
			urlPath := strings.TrimSuffix(relPath, "index.html")

			url := *siteURL
			url.Path = urlPath

			page := &Page{
				Site:        site,
				Path:        path,
				Dir:         filepath.Dir(path),
				Frontmatter: &frontmatter,
				Markdown:    parts[2],
				URL:         url.String(),
				OutputFile:  outputPath,
			}
			site.Pages = append(site.Pages, page)

			for _, tag := range frontmatter.Tags {
				site.PagesByTag[tag] = append(site.PagesByTag[tag], page)
			}
		}
		return nil
	}

	renderPage := func(page *Page) error {
		if len(page.Frontmatter.Templates) == 0 {
			return fmt.Errorf("Templates field is missing in frontmatter in file %s", page.Path)
		}

		// First template in frontmatter should be the base template.
		baseTemplate := filepath.Base(page.Frontmatter.Templates[0])

		templatePaths := make([]string, len(page.Frontmatter.Templates))
		for i, path := range page.Frontmatter.Templates {
			templatePaths[i] = filepath.Join(rootDir, path)
		}

		tmpl, err := template.New("").Funcs(template.FuncMap{
			"Now":     now,
			"Include": makeIncludeFunc(page.Path, page),
		}).ParseFiles(templatePaths...)
		if err != nil {
			return fmt.Errorf("Error parsing templates in file %s: %w", page.Path, err)
		}

		extensions := parser.CommonExtensions | parser.AutoHeadingIDs | parser.NoEmptyLineBeforeBlock | parser.Attributes
		p := parser.NewWithExtensions(extensions)

		doc := markdown.Parse([]byte(page.Markdown), p)

		opts := html.RendererOptions{
			Flags: html.CommonFlags,
		}
		renderer := html.NewRenderer(opts)
		htmlContent := markdown.Render(doc, renderer)
		page.Content = string(htmlContent)

		var htmlBuffer strings.Builder
		if err := tmpl.ExecuteTemplate(&htmlBuffer, baseTemplate, page); err != nil {
			return fmt.Errorf("Error rendering Markdown in file %s: %w", page.Path, err)
		}

		err = ioutil.WriteFile(page.OutputFile, []byte(htmlBuffer.String()), 0644)
		if err != nil {
			return fmt.Errorf("Error writing HTML file %s: %w", page.OutputFile, err)
		}

		fmt.Printf("Converted %s to %s\n", page.Path, page.OutputFile)

		return nil
	}

	// Process markdown files and populate Site object
	err = filepath.Walk(rootDir, processMarkdownFile)
	if err != nil {
		log.Fatalf("Error processing markdown files: %v", err)
	}

	// Sort PagesByTag by Date
	for _, pages := range site.PagesByTag {
		p := pages
		sort.Slice(p, func(i, j int) bool {
			return p[i].Date.After(p[j].Date)
		})
	}

	// Render markdown files to HTML
	for _, page := range site.Pages {
		err := renderPage(page)
		if err != nil {
			log.Fatalf("Error rendering page: %v", err)
		}
	}
}

func now() time.Time {
	return time.Now()
}

func makeIncludeFunc(path string, page *Page) func(string) (string, error) {
	return func(filename string) (string, error) {
		currentDir := filepath.Dir(path)
		includeFilePath := filepath.Join(currentDir, filename)

		includeContent, err := ioutil.ReadFile(includeFilePath)
		if err != nil {
			return "", fmt.Errorf("Error reading included file %s: %w", includeFilePath, err)
		}

		tmpl, err := template.New("include").Funcs(template.FuncMap{
			"Now":     now,
			"Include": makeIncludeFunc(includeFilePath, page),
		}).Parse(string(includeContent))
		if err != nil {
			return "", fmt.Errorf("Error parsing included file %s: %w", includeFilePath, err)
		}

		var includeBuffer strings.Builder
		if err := tmpl.Execute(&includeBuffer, page); err != nil {
			return "", fmt.Errorf("Error rendering included file %s: %w", includeFilePath, err)
		}

		return includeBuffer.String(), nil
	}
}

func getCurrentGitSHA(dir string) (string, error) {
	// Check if the current directory is within a Git repository
	cmd := exec.Command("git", "rev-parse", "HEAD")
	cmd.Dir = dir // Use the current directory

	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	if err != nil {
		return "", err
	}

	// Trim leading and trailing white spaces
	sha := out.String()
	sha = strings.TrimSpace(sha)

	return sha, nil
}
