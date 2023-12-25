package main

import (
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
)

type Token struct {
	Name  string
	Value string
	Line  int
}

func (t Token) isEOL() bool {
	return t.Name == "EOL"
}

func (t Token) isEOF() bool {
	return t.Name == "EOF"
}

type NodeList []FunctionNode

func (nodes NodeList) lastNonEmptyLineIndex() int {
	j := len(nodes) - 1
	for ; j >= 0; j-- {
		if !nodes[j].isEmpty() && !nodes[j].isComment() {
			break
		}
	}
	return j
}

func (nodes NodeList) nextNonEmptyLineIndex(start int) int {
	for i := start; i < len(nodes); i++ {
		if nodes[i].isEmpty() || nodes[i].isComment() {
			continue
		}
		return i
	}
	return -1
}

func (nodes NodeList) Write(w io.StringWriter) {
	for _, node := range nodes {
		node.Write(w)
		w.WriteString("\n")
	}
}

type CondNode struct {
	Test   FunctionNode
	Negate bool
}

type IfNode struct {
	Label  string
	Cond   CondNode
	Body   NodeList
	ElseIf []IfNode
	Else   NodeList
}

type WhileNode struct {
	Label   string
	Cond    CondNode
	Body    NodeList
	Endless bool
}

type DoNode struct {
	Label   string
	Cond    CondNode
	Body    NodeList
	Endless bool
}

type FunctionNode struct {
	Name      string
	Arguments []ValueNode
	Comment   []ValueNode
}

// Return true for "empty line" nodes
func (f FunctionNode) isEmpty() bool {
	return f.Name == ""
}

func (f FunctionNode) isComment() bool {
	switch f.Name {
	case "NOTE", ";", "@REP", "@END":
		return true
	}
	return false
}

func (f FunctionNode) Write(w io.StringWriter) {
	w.WriteString(f.Name)
	if len(f.Arguments) > 0 {
		for _, arg := range f.Arguments {
			w.WriteString(" ")
			arg.Write(w)
		}
	}
	if len(f.Comment) > 0 {
		w.WriteString(" ;")
		for _, arg := range f.Comment {
			w.WriteString(" ")
			arg.Write(w)
		}
	}
}

type ValueNode struct {
	Name  string
	Value string
}

func (v ValueNode) Write(w io.StringWriter) {
	w.WriteString(v.Value)
}

func tokenize(input string) ([]Token, error) {
	tokens := []Token{}

	input = strings.ToUpper(input)
	lines := strings.Split(input, "\n")

	lineNum := 1

	for _, line := range lines {
		// Split on line comment character first, to avoid syntax errors if ";"
		// is not surrounded by whitespace, since we're not doing
		// character-by-character tokenization.
		line, comment, hasComment := strings.Cut(line, ";")
		line = strings.TrimSpace(line)
		words := strings.Fields(line)
		for _, word := range words {
			token := Token{Name: "LITERAL", Value: word, Line: lineNum}
			tokens = append(tokens, token)
		}
		if hasComment {
			comment = strings.TrimSpace(comment)
			token := Token{Name: "LITERAL", Value: ";", Line: lineNum}
			tokens = append(tokens, token)
			token = Token{Name: "LITERAL", Value: comment, Line: lineNum}
			tokens = append(tokens, token)
		}
		token := Token{Name: "EOL", Value: "EOL", Line: lineNum}
		tokens = append(tokens, token)
		lineNum += 1
	}

	token := Token{Name: "EOF", Value: "EOF", Line: lineNum}
	tokens = append(tokens, token)

	return tokens, nil
}

type Parser struct {
	labelID    int
	labelStack []string
	tokens     []Token
}

func NewParser(tokens []Token) *Parser {
	return &Parser{0, []string{}, tokens}
}

func (p *Parser) current() Token {
	return p.tokens[0]
}

func (p *Parser) peek() Token {
	if len(p.tokens) > 1 {
		return p.tokens[1]
	}
	return Token{}
}

func (p *Parser) pop() (Token, error) {
	if len(p.tokens) == 0 {
		return Token{}, fmt.Errorf("unexpected end of program")
	}
	token := p.tokens[0]
	p.tokens = p.tokens[1:]
	return token, nil
}

func (p *Parser) expect(value string) (Token, error) {
	token, err := p.pop()
	if err != nil {
		return Token{}, err
	}
	if token.Value != value {
		return Token{}, fmt.Errorf("expected %s but got '%s' on line %d", value, token.Value, token.Line)
	}
	return token, nil
}

func (p *Parser) expectNotEmpty() (Token, error) {
	token, err := p.pop()
	if err != nil {
		return Token{}, err
	}
	if token.Value == "EOL" {
		return Token{}, fmt.Errorf("unexpected EOL")
	}
	return token, nil
}

func (p *Parser) isEndOfBody() bool {
	return p.current().Value == "END" || p.current().Value == "ELSE" || p.current().Value == "LOOP" || p.current().isEOF()
}

func (p *Parser) isEOL() bool {
	return p.current().isEOL() || p.current().isEOF()
}

func (p *Parser) isStartOfComment() bool {
	return p.current().Value == ";"
}

func (p *Parser) parseArguments(n int) ([]ValueNode, error) {
	args := []ValueNode{}
	for !p.isEOL() && !p.isStartOfComment() {
		token, err := p.expectNotEmpty()
		if err != nil {
			return []ValueNode{}, fmt.Errorf("error parsing argument: %w", err)
		}
		args = append(args, ValueNode{Name: "LITERAL", Value: token.Value})
	}
	if n > 0 && len(args) != n {
		return []ValueNode{}, fmt.Errorf("expected %d arguments but got %d", n, len(args))
	}
	return args, nil
}

func (p *Parser) parseValue() (ValueNode, error) {
	token, err := p.expectNotEmpty()
	if err != nil {
		return ValueNode{}, fmt.Errorf("error parsing value: %w", err)
	}
	return ValueNode{Name: "LITERAL", Value: token.Value}, nil
}

func (p *Parser) parseOperator() (ValueNode, error) {
	token, err := p.expectNotEmpty()
	if err != nil {
		return ValueNode{}, fmt.Errorf("error parsing value: %w", err)
	}
	return ValueNode{Name: "OPERATOR", Value: token.Value}, nil
}

func (p *Parser) parseAssignExpr() (FunctionNode, error) {
	to, err := p.parseValue()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing assign register: %w", err)
	}
	_, err = p.expect("=")
	if err != nil {
		return FunctionNode{}, err
	}
	left, err := p.parseValue()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing assign value: %w", err)
	}

	if p.isEOL() {
		return FunctionNode{Name: "COPY", Arguments: []ValueNode{left, to}}, nil
	}

	op, err := p.parseOperator()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing assign operator: %w", err)
	}

	// Rewrite "X = RAND 1 10" to "X = 1 RAND 10"
	if left.Value == "RAND" {
		op, left = left, op
	}

	switch op.Value {
	case "+":
		op.Value = "ADDI"
	case "-":
		op.Value = "SUBI"
	case "*":
		op.Value = "MULI"
	case "/":
		op.Value = "DIVI"
	case "%":
		op.Value = "MODI"
	case "SWIZ", "RAND":
		// no change
	default:
		return FunctionNode{}, fmt.Errorf("invalid operator: %s", op.Value)
	}

	right, err := p.parseValue()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing assign operand: %w", err)
	}

	return FunctionNode{Name: op.Value, Arguments: []ValueNode{left, right, to}}, nil
}

func (p *Parser) parseShortAssignExpr() (FunctionNode, error) {
	to, err := p.parseValue()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing short assign register:% w", err)
	}

	op, err := p.parseOperator()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing short assign operator:% w", err)
	}

	switch op.Value {
	case "+=":
		op.Value = "ADDI"
	case "-=":
		op.Value = "SUBI"
	case "*=":
		op.Value = "MULI"
	case "/=":
		op.Value = "DIVI"
	case "%=":
		op.Value = "MODI"
	default:
		return FunctionNode{}, fmt.Errorf("invalid operator: %s", op.Value)
	}

	right, err := p.parseValue()
	if err != nil {
		return FunctionNode{}, fmt.Errorf("error parsing short assign value:% w", err)
	}

	return FunctionNode{Name: op.Value, Arguments: []ValueNode{to, right, to}}, nil
}

func (p *Parser) parseCondExpr() (CondNode, error) {
	negate := false
	if p.current().Value == "NOT" {
		_, err := p.expect("NOT")
		if err != nil {
			return CondNode{}, err
		}
		negate = true
	}

	left, err := p.parseValue()
	if err != nil {
		return CondNode{}, fmt.Errorf("error parsing left operand: %w", err)
	}

	if left.Value == "EOF" || left.Value == "MRD" {
		testEOF := FunctionNode{Name: "TEST", Arguments: []ValueNode{left}}
		return CondNode{Test: testEOF, Negate: negate}, nil
	} else if left.Value == "ISTRUE" {
		istrue := FunctionNode{Name: "NOOP", Arguments: []ValueNode{left}}
		return CondNode{Test: istrue, Negate: negate}, nil
	} else if left.Value == "ISFALSE" {
		isfalse := FunctionNode{Name: "NOOP", Arguments: []ValueNode{left}}
		return CondNode{Test: isfalse, Negate: !negate}, nil
	}

	op, err := p.parseOperator()
	if err != nil {
		return CondNode{}, fmt.Errorf("error parsing operator: %w", err)
	}
	right, err := p.parseValue()
	if err != nil {
		return CondNode{}, fmt.Errorf("error parsing right operand: %w", err)
	}

	switch op.Value {
	case "=", ">", "<":
		// no change
	case "!=":
		op.Value = "="
		negate = !negate
	case ">=":
		op.Value = "<"
		negate = !negate
	case "<=":
		op.Value = ">"
		negate = !negate
	default:
		return CondNode{}, fmt.Errorf("invalid operator: %s", op.Value)
	}

	testNode := FunctionNode{Name: "TEST", Arguments: []ValueNode{left, op, right}}
	return CondNode{Test: testNode, Negate: negate}, nil
}

func (p *Parser) parseElseIfExpr() (IfNode, error) {
	label := fmt.Sprintf("ELSEIF_%d", p.labelID)
	p.labelID++

	_, err := p.expect("ELSE")
	if err != nil {
		return IfNode{}, err
	}

	_, err = p.expect("IF")
	if err != nil {
		return IfNode{}, err
	}

	cond, err := p.parseCondExpr()
	if err != nil {
		return IfNode{}, fmt.Errorf("error parsing condition: %w", err)
	}

	_, err = p.expect("EOL")
	if err != nil {
		return IfNode{}, err
	}

	body, err := p.parseBody()
	if err != nil {
		return IfNode{}, fmt.Errorf("error parsing body: %w", err)
	}

	return IfNode{Label: label, Cond: cond, Body: body}, nil
}

func (p *Parser) parseIfExpr() (IfNode, error) {
	label := fmt.Sprintf("IF_%d", p.labelID)
	p.labelID++

	_, err := p.expect("IF")
	if err != nil {
		return IfNode{}, err
	}

	cond, err := p.parseCondExpr()
	if err != nil {
		return IfNode{}, fmt.Errorf("error parsing condition: %w", err)
	}

	_, err = p.expect("EOL")
	if err != nil {
		return IfNode{}, err
	}

	body, err := p.parseBody()
	if err != nil {
		return IfNode{}, fmt.Errorf("error parsing body: %w", err)
	}

	var elseIfList []IfNode
	for p.current().Value == "ELSE" && p.peek().Value == "IF" {
		elseIfNode, err := p.parseElseIfExpr()
		if err != nil {
			return IfNode{}, fmt.Errorf("error parsing ELSE IF clause: %w", err)
		}
		elseIfList = append(elseIfList, elseIfNode)
	}

	var elseBody NodeList
	if p.current().Value == "ELSE" {
		_, err := p.expect("ELSE")
		if err != nil {
			return IfNode{}, err
		}
		_, err = p.expect("EOL")
		if err != nil {
			return IfNode{}, err
		}
		elseBody, err = p.parseBody()
		if err != nil {
			return IfNode{}, fmt.Errorf("error parsing ELSE clause: %w", err)
		}
	}

	_, err = p.expect("END")
	if err != nil {
		return IfNode{}, err
	}

	return IfNode{Label: label, Cond: cond, Body: body, ElseIf: elseIfList, Else: elseBody}, nil
}

func (p *Parser) transformIfExpr(ifNode IfNode, parentEndLabel ValueNode) NodeList {
	label := ValueNode{Name: "LITERAL", Value: ifNode.Label}
	nextLabel := ValueNode{Name: "LITERAL", Value: ifNode.Label + "_NEXT"}
	endLabel := ValueNode{Name: "LITERAL", Value: ifNode.Label + "_END"}

	nodes := NodeList{}
	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{label}})

	if ifNode.Cond.Test.Name != "NOOP" {
		nodes = append(nodes, ifNode.Cond.Test)
	}

	if ifNode.Cond.Negate {
		nodes = append(nodes, FunctionNode{Name: "TJMP", Arguments: []ValueNode{nextLabel}})
	} else {
		nodes = append(nodes, FunctionNode{Name: "FJMP", Arguments: []ValueNode{nextLabel}})
	}

	nodes = append(nodes, ifNode.Body...)

	if parentEndLabel.Value != "" {
		nodes = append(nodes, FunctionNode{Name: "JUMP", Arguments: []ValueNode{parentEndLabel}})
	} else {
		nodes = append(nodes, FunctionNode{Name: "JUMP", Arguments: []ValueNode{endLabel}})
	}

	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{nextLabel}})

	for _, elseIfNode := range ifNode.ElseIf {
		elseIfNodes := p.transformIfExpr(elseIfNode, endLabel)
		nodes = append(nodes, elseIfNodes...)
	}

	nodes = append(nodes, ifNode.Else...)
	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{endLabel}})
	return nodes
}

func (p *Parser) parseWhileExpr() (WhileNode, error) {
	label := fmt.Sprintf("WHILE_%d", p.labelID)
	p.labelStack = append(p.labelStack, label)
	p.labelID++

	_, err := p.expect("WHILE")
	if err != nil {
		return WhileNode{}, err
	}

	endless := true

	// Parse optional condition
	var cond CondNode
	if !p.isEOL() && !p.isStartOfComment() {
		endless = false
		cond, err = p.parseCondExpr()
		if err != nil {
			return WhileNode{}, fmt.Errorf("error parsing condition: %w", err)
		}
	}

	_, err = p.expect("EOL")
	if err != nil {
		return WhileNode{}, err
	}

	body, err := p.parseBody()
	if err != nil {
		return WhileNode{}, fmt.Errorf("error parsing body: %w", err)
	}

	_, err = p.expect("LOOP")
	if err != nil {
		return WhileNode{}, err
	}

	return WhileNode{Label: label, Cond: cond, Body: body, Endless: endless}, nil
}

func (p *Parser) transformWhileExpr(whileNode WhileNode) NodeList {
	label := ValueNode{Name: "LITERAL", Value: whileNode.Label}
	endLabel := ValueNode{Name: "LITERAL", Value: whileNode.Label + "_END"}

	nodes := NodeList{}
	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{label}})

	if !whileNode.Endless {
		if whileNode.Cond.Test.Name != "NOOP" {
			nodes = append(nodes, whileNode.Cond.Test)
		}
		if whileNode.Cond.Negate {
			nodes = append(nodes, FunctionNode{Name: "TJMP", Arguments: []ValueNode{endLabel}})
		} else {
			nodes = append(nodes, FunctionNode{Name: "FJMP", Arguments: []ValueNode{endLabel}})
		}
	}

	nodes = append(nodes, whileNode.Body...)
	nodes = append(nodes, FunctionNode{Name: "JUMP", Arguments: []ValueNode{label}})
	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{endLabel}})
	return nodes
}

func (p *Parser) parseDoExpr() (DoNode, error) {
	label := fmt.Sprintf("DO_%d", p.labelID)
	p.labelStack = append(p.labelStack, label)
	p.labelID++

	_, err := p.expect("DO")
	if err != nil {
		return DoNode{}, err
	}

	_, err = p.expect("EOL")
	if err != nil {
		return DoNode{}, err
	}

	body, err := p.parseBody()
	if err != nil {
		return DoNode{}, fmt.Errorf("error parsing body: %w", err)
	}

	_, err = p.expect("LOOP")
	if err != nil {
		return DoNode{}, err
	}

	endless := true

	var cond CondNode
	if p.current().Value == "WHILE" {
		endless = false
		_, err := p.expect("WHILE")
		if err != nil {
			return DoNode{}, err
		}
		cond, err = p.parseCondExpr()
		if err != nil {
			return DoNode{}, fmt.Errorf("error parsing condition: %w", err)
		}
	}

	return DoNode{Label: label, Cond: cond, Body: body, Endless: endless}, nil
}

func (p *Parser) transformDoExpr(doNode DoNode) NodeList {
	label := ValueNode{Name: "LITERAL", Value: doNode.Label}
	endLabel := ValueNode{Name: "LITERAL", Value: doNode.Label + "_END"}

	nodes := NodeList{}
	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{label}})
	nodes = append(nodes, doNode.Body...)

	if doNode.Endless {
		nodes = append(nodes, FunctionNode{Name: "JUMP", Arguments: []ValueNode{label}})
	} else {
		if doNode.Cond.Test.Name != "NOOP" {
			nodes = append(nodes, doNode.Cond.Test)
		}
		if doNode.Cond.Negate {
			nodes = append(nodes, FunctionNode{Name: "FJMP", Arguments: []ValueNode{label}})
		} else {
			nodes = append(nodes, FunctionNode{Name: "TJMP", Arguments: []ValueNode{label}})
		}
	}

	nodes = append(nodes, FunctionNode{Name: "MARK", Arguments: []ValueNode{endLabel}})
	return nodes
}

func (p *Parser) parseBody() (NodeList, error) {
	nodes := []FunctionNode{}

	for !p.isEndOfBody() {
		switch p.current().Value {
		case "EOL":
			_, err := p.pop()
			if err != nil {
				return nil, err
			}
			// Preserve blank lines
			node := FunctionNode{Name: ""}
			nodes = append(nodes, node)
			continue
		case "HALT", "KILL", "MODE", "MAKE", "DROP", "WIPE", "NOOP", "@END":
			// Parse function with 0 arguments
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			node := FunctionNode{Name: token.Value}
			nodes = append(nodes, node)
		case "BREAK":
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			if len(p.labelStack) == 0 {
				return nil, fmt.Errorf("BREAK called outside of loop on line %d", token.Line)
			}

			// pop label from stack
			label := p.labelStack[len(p.labelStack)-1]
			p.labelStack = p.labelStack[:len(p.labelStack)-1]

			labelVal := ValueNode{Name: "LITERAL", Value: fmt.Sprintf("%s_END", label)}
			commentVal := ValueNode{Name: ";", Value: "BREAK"}

			jump := "JUMP"
			if p.current().Value == "IFTRUE" {
				_, err = p.expect("IFTRUE")
				if err != nil {
					return nil, err
				}
				jump = "TJMP"
			} else if p.current().Value == "IFFALSE" {
				_, err = p.expect("IFFALSE")
				if err != nil {
					return nil, err
				}
				jump = "FJMP"
			}

			nodes = append(nodes, FunctionNode{Name: jump, Arguments: []ValueNode{labelVal}, Comment: []ValueNode{commentVal}})
		case "CONTINUE":
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			if len(p.labelStack) == 0 {
				return nil, fmt.Errorf("CONTINUE called outside of loop on line %d", token.Line)
			}

			label := p.labelStack[len(p.labelStack)-1]

			labelVal := ValueNode{Name: "LITERAL", Value: label}
			commentVal := ValueNode{Name: ";", Value: "CONTINUE"}

			jump := "JUMP"
			if p.current().Value == "IFTRUE" {
				_, err = p.expect("IFTRUE")
				if err != nil {
					return nil, err
				}
				jump = "TJMP"
			} else if p.current().Value == "IFFALSE" {
				_, err = p.expect("IFFALSE")
				if err != nil {
					return nil, err
				}
				jump = "FJMP"
			}

			nodes = append(nodes, FunctionNode{Name: jump, Arguments: []ValueNode{labelVal}, Comment: []ValueNode{commentVal}})
		case "NOTE", ";":
			// Parse 0 or more arguments
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			args, err := p.parseArguments(-1)
			if err != nil {
				return nil, fmt.Errorf("invalid arguments on line %d: %w", token.Line, err)
			}
			node := FunctionNode{Name: token.Value, Arguments: args}
			nodes = append(nodes, node)
		case "LINK", "GRAB", "MARK", "JUMP", "TJMP", "FJMP", "FILE", "SEEK", "VOID", "REPL", "HOST", "@REP":
			// Parse function with 1 argument
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			args, err := p.parseArguments(1)
			if err != nil {
				return nil, fmt.Errorf("invalid arguments on line %d: %w", token.Line, err)
			}
			node := FunctionNode{Name: token.Value, Arguments: args}
			nodes = append(nodes, node)
		case "COPY":
			// Parse function with 2 arguments
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			args, err := p.parseArguments(2)
			if err != nil {
				return nil, fmt.Errorf("invalid arguments on line %d: %w", token.Line, err)
			}
			node := FunctionNode{Name: token.Value, Arguments: args}
			nodes = append(nodes, node)
		case "TEST":
			// Parse function with 3 arguments
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			cond, err := p.parseCondExpr()
			if err != nil {
				return nil, fmt.Errorf("syntax error on line %d: %w", token.Line, err)
			}
			if cond.Test.Name != "NOOP" {
				nodes = append(nodes, cond.Test)
				if cond.Negate {
					one := ValueNode{Name: "LITERAL", Value: "1"}
					t := ValueNode{Name: "LITERAL", Value: "T"}
					nodes = append(nodes, FunctionNode{Name: "SUBI", Arguments: []ValueNode{one, t, t}})
				}
			}
		case "ADDI", "SUBI", "MULI", "DIVI", "MODI", "SWIZ", "RAND":
			// Parse function with 3 arguments
			token, err := p.pop()
			if err != nil {
				return nil, err
			}
			args, err := p.parseArguments(3)
			if err != nil {
				return nil, fmt.Errorf("invalid arguments on line %d: %w", token.Line, err)
			}
			node := FunctionNode{Name: token.Value, Arguments: args}
			nodes = append(nodes, node)
		case "IF":
			token := p.current()
			node, err := p.parseIfExpr()
			if err != nil {
				return nil, fmt.Errorf("error parsing IF on line %d: %w", token.Line, err)
			}
			nodeList := p.transformIfExpr(node, ValueNode{})
			nodes = append(nodes, nodeList...)
		case "WHILE":
			token := p.current()
			node, err := p.parseWhileExpr()
			if err != nil {
				return nil, fmt.Errorf("error parsing WHILE on line %d: %w", token.Line, err)
			}
			nodeList := p.transformWhileExpr(node)
			nodes = append(nodes, nodeList...)
		case "DO":
			token := p.current()
			node, err := p.parseDoExpr()
			if err != nil {
				return nil, fmt.Errorf("error parsing DO on line %d: %w", token.Line, err)
			}
			nodeList := p.transformDoExpr(node)
			nodes = append(nodes, nodeList...)
		default:
			// Expect token to be a register
			token := p.current()
			if p.peek().Value == "=" {
				node, err := p.parseAssignExpr()
				if err != nil {
					return nil, fmt.Errorf("invalid assignment expression on line %d: %w", token.Line, err)
				}
				nodes = append(nodes, node)
			} else if strings.HasSuffix(p.peek().Value, "=") {
				node, err := p.parseShortAssignExpr()
				if err != nil {
					return nil, fmt.Errorf("invalid short assignment expression on line %d: %w", token.Line, err)
				}
				nodes = append(nodes, node)
			} else {
				return nil, fmt.Errorf("unexpected token on line %d: %s", token.Line, token.Value)
			}
		}

		// Parse optional trailing comment
		if p.isStartOfComment() {
			token, err := p.expect(";")
			if err != nil {
				return nil, err
			}
			args, err := p.parseArguments(-1)
			if err != nil {
				return nil, fmt.Errorf("invalid arguments on line %d: %w", token.Line, err)
			}
			// Attach comment to last node
			fnNode := &nodes[len(nodes)-1]
			fnNode.Comment = args
		}

		_, err := p.expect("EOL")
		if err != nil {
			return nil, err
		}
	}

	return NodeList(nodes), nil
}

func (p *Parser) parse() (NodeList, error) {
	body, err := p.parseBody()
	if err != nil {
		return NodeList{}, err
	}

	_, err = p.expect("EOF")
	if err != nil {
		return NodeList{}, err
	}

	return body, nil
}

func optimize(nodes NodeList) (NodeList, int) {
	iterations := 0
	changed := true
	labelID := 0

	for iterations < 100 {
		changed = false
		newNodes := NodeList{}

		markIndex := map[string]int{}
		jumpLabelCount := map[string]int{}

		for i, node := range nodes {
			switch node.Name {
			case "JUMP", "TJMP", "FJMP", "REPL":
				label := node.Arguments[0].Value
				jumpLabelCount[label] += 1
			case "MARK":
				label := node.Arguments[0].Value
				markIndex[label] = i
			}
		}

		for i := 0; i < len(nodes); i++ {
			node := nodes[i]

			// Don't optimize away empty lines and comments.
			if node.isEmpty() || node.isComment() {
				newNodes = append(newNodes, node)
				continue
			}

			// Remove unused labels (MARK with no corresponding JUMP/TJMP/FJMP/REPL).
			if node.Name == "MARK" && jumpLabelCount[node.Arguments[0].Value] == 0 {
				changed = true
				continue
			}

			// Previous non-empty line in NEW nodes list
			lastAddedIndex := newNodes.lastNonEmptyLineIndex()

			// Next non-empty line in OLD nodes list
			nextIndex := nodes.nextNonEmptyLineIndex(i + 1)

			// Combine MARKS defined next to each other.
			// ---
			// Before:
			// TMP A
			// JUMP B
			// MARK A
			// MARK B <- redundant
			// ---
			// After:
			// TMP L0
			// JUMP L0
			// MARK L0
			if node.Name == "MARK" && nextIndex != -1 && nodes[nextIndex].Name == "MARK" {
				label1 := node.Arguments[0].Value
				label2 := nodes[nextIndex].Arguments[0].Value

				newLabel := fmt.Sprintf("L%d", labelID)
				labelID++

				jumpLabelCount[newLabel] = jumpLabelCount[label1] + jumpLabelCount[label2]
				jumpLabelCount[label1] = 0
				jumpLabelCount[label2] = 0

				nodes[nextIndex].Arguments[0].Value = newLabel

				for j := 0; j < len(nodes); j++ {
					other := &nodes[j]
					switch other.Name {
					case "JUMP", "TJMP", "FJMP", "REPL":
						if other.Arguments[0].Value == label1 || other.Arguments[0].Value == label2 {
							other.Arguments[0].Value = newLabel
						}
					}
				}
				for j := 0; j < len(newNodes); j++ {
					other := &newNodes[j]
					switch other.Name {
					case "JUMP", "TJMP", "FJMP", "REPL":
						if other.Arguments[0].Value == label1 || other.Arguments[0].Value == label2 {
							other.Arguments[0].Value = newLabel
						}
					}
				}
				changed = true
				continue
			}

			// Remove line preceded by a JUMP, unless it's a MARK or REPL,
			// because it's unreachable.
			// ---
			// JUMP A
			// COPY 0 X <- unreachable
			// MARK A
			if lastAddedIndex != -1 && newNodes[lastAddedIndex].Name == "JUMP" {
				if node.Name != "MARK" && node.Name != "REPL" {
					changed = true
					continue
				}
			}

			// Remove useless JUMP/MARK pairs separated by 0 or more other
			// MARKS produced from generated code.
			// ---
			// JUMP A <- useless
			// MARK X
			// MARK A
			if node.Name == "JUMP" && markIndex[node.Arguments[0].Value] > i {
				j := i + 1
				for ; j < markIndex[node.Arguments[0].Value]; j++ {
					if nodes[j].Name == "MARK" || nodes[j].Name == "REPL" {
						break
					}
				}
				if j == markIndex[node.Arguments[0].Value] {
					// Remove all nodes up to but not including MARK
					i = j - 1
					changed = true
					continue
				}
			}

			newNodes = append(newNodes, node)
		}

		if !changed {
			break
		}

		nodes = newNodes
		iterations++
	}

	return nodes, iterations
}

func serialize(nodes NodeList) string {
	var sb strings.Builder
	nodes.Write(&sb)
	return sb.String()
}

func main() {
	inputFile := flag.String("input", "", "Input file path")
	flag.Parse()

	if *inputFile == "" {
		fmt.Println("Please provide an input file using the -input flag.")
		os.Exit(1)
	}

	content, err := os.ReadFile(*inputFile)
	if err != nil {
		fmt.Printf("Error reading input file: %v\n", err)
		os.Exit(1)
	}

	input := string(content)

	tokens, err := tokenize(input)
	if err != nil {
		fmt.Printf("Tokenize error: %s\n", err)
		os.Exit(1)
	}

	parser := NewParser(tokens)
	nodes, err := parser.parse()
	if err != nil {
		fmt.Printf("Parse error: %s\n", err)
		os.Exit(1)
	}

	nodes, iterations := optimize(nodes)

	output := serialize(nodes)
	fmt.Println(output)

	loc := 0
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if line == "" || strings.HasPrefix(line, "NOTE") || strings.HasPrefix(line, ";") || strings.HasPrefix(line, "@REP") || strings.HasPrefix(line, "@END") {
			continue
		}
		loc++
	}
	fmt.Printf("LOC: %d\n", loc)

	if iterations > 0 {
		plural := ""
		if iterations != 1 {
			plural = "es"
		}
		fmt.Printf("Optimized in %d pass%s\n", iterations, plural)
	}
}
