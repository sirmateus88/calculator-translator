function Calculator(inputString){
  this.tokenStream = this.lexer(inputString);
}

Calculator.prototype.lexer = function(inputString) {
  var tokenTypes = [
    ["NUMBER",    /^\d+/ ],
    ["ADD",       /^\+/  ],
    ["SUB",       /^\-/  ],
    ["MUL",       /^\*/  ],
    ["DIV",       /^\//  ],
    ["LPAREN",    /^\(/  ],
    ["RPAREN",    /^\)/  ]
  ];

  var tokens = [];
  var matched = true;

  while(inputString.length > 0 && matched) {
    matched = false;

    tokenTypes.forEach(tokenRegex => {
      var token = tokenRegex[0];
      var regex = tokenRegex[1];

      var result = regex.exec(inputString);

      if(result !== null) {
        matched = true;
        tokens.push({name: token, value: result[0]});
        inputString = inputString.slice(result[0].length)
      }
    })

    if(!matched) {
      throw new Error("Found unparseable token: " + inputString);
    }
  }

  return tokens;
};

Calculator.prototype.peek = function(){
  return this.tokenStream[0] || null;
}

Calculator.prototype.get = function(){
  return this.tokenStream.shift();
}

Calculator.prototype.parseExpression = function(){
  //maybe we need to parse B in some cases?
  var term = this.parseTerm();
  var a = this.parseA();
  return new TreeNode('Expression', term, a);
}

Calculator.prototype.parseTerm = function(){
  var factor = this.parseFactor();
  var b = this.parseB()
  return new TreeNode('Term', factor, b);
}

Calculator.prototype.parseA = function(){
  //if empty, make an a treenode with no children
  var current = this.peek();
  var term;
  var a;

  if(!current){
    return new TreeNode('A');
  } else if(current.name === 'ADD'){
    this.get();
    term = this.parseTerm();
    a = this.parseA();
    return new TreeNode('A', current.value, term, a);
  } else if(current.name === 'SUB'){
    this.get();
    term = this.parseTerm();
    a = this.parseA();
    return new TreeNode('A', current.value, term, a);
  } else {
    return new TreeNode('A');
  }
}

Calculator.prototype.parseB = function(){
  var current = this.peek();
  var factor;
  var b;

  if(!current){
    return new TreeNode('B');
  } else if(current.name === 'MUL'){
    this.get();
    factor = this.parseFactor();
    b = this.parseB();
    return new TreeNode('B', current.value, factor, b);
  } else if(current.name === 'DIV'){
    this.get();
    factor = this.parseFactor();
    b = this.parseB();
    return new TreeNode('B', current.value, factor, b);
  } else if (current.name === 'RPAREN'){
    this.get();
    return new TreeNode('B');
  } else {
    return new TreeNode('B');
  }
}

Calculator.prototype.parseFactor = function(){
  var current = this.get();
  var expression;
  var factor;

  if(current.name === 'LPAREN'){
    expression = this.parseExpression()
    return new TreeNode('Factor', '(', expression, ')');
  } else if(current.name === 'SUB'){
    factor = this.parseFactor();
    return new TreeNode('Factor', current.value, factor);
  } else if (current.name === 'RPAREN'){
    this.get();
    return new TreeNode('Factor', expression);
  } else {
    return new TreeNode('Factor', current.value);
  }
}

function TreeNode(name, ...children){
  this.name = name;
  this.children = children;
}

TreeNode.prototype.accept = function(visitor){
  visitor.visit(this);
};

function Visitor(){
  this.stack = [];
}

Visitor.prototype.visit = function(node){
  //we are at the node
  //put its kids in a queue, prioritizing objects first
  var treeQueue = [];
  var current;

  node.children.forEach(function(el){
    if (typeof el === 'object'){
      treeQueue.push(el);
    }
  });
  node.children.forEach(function(el){
    if (typeof el !== 'object'){
      treeQueue.push(el);
    }
  });
  while (treeQueue.length){
    current = treeQueue.shift();
    if(typeof current === 'string' && !(current === '(' || current === ')')){
      this.stack.push(current);
    } else if (typeof current === 'object'){
      this.visit(current);
    }
  }
  //visit each kid
  //if its a string that isn't a parens, push to stack
  //if it is an object, visit the object
  //if its an empty array, don't do anything
}

Visitor.prototype.calculate = function(){
  var numArr = [];
  var current;
  var firstVal;
  var secondVal;

  while (this.stack.length){
    current = this.stack.shift();
    if (this.isNum(current)){
      numArr.push(Number(current));
    } else if (current === '*'){
      firstVal = numArr.pop();
      secondVal = numArr.pop();
      numArr.push(firstVal * secondVal);
    } else if (current === '/'){
      firstVal = numArr.pop();
      secondVal = numArr.pop();
      numArr.push(secondVal / firstVal);
    } else if (current === '+'){
      firstVal = numArr.pop();
      secondVal = numArr.pop();
      numArr.push(firstVal + secondVal);
    } else if (current === '-'){
      firstVal = numArr.pop();
      secondVal = numArr.pop();
      numArr.push(secondVal - firstVal);
    }
  }
  return numArr.pop();
}

Visitor.prototype.isNum = function(value){
  if (value === '*'){
    return false;
  } else if(value === '/'){
    return false;
  } else if(value === '+'){
    return false;
  } else if (value === '-'){
    return false;
  }
  return true;
}

var cal = new Calculator('(2+8*5)-((5+5)*3)+2');
var parsed = cal.parseExpression();
var vis = new Visitor();
parsed.accept(vis);
var total = vis.calculate();

