# Style Guide

## Table of Contents

  1. [Code Layout](#code-layout)
        1. [Indentation](#indentation)
        2. [Tabs or Spaces](#tabs-or-spaces)
        3. [Blank Lines](#blank-lines)
        4. [Maximum Line Length](#maximum-line-length)
        5. [Imports](#imports)
        6. [Order of Declarations](#order-of-declarations)
        7. [Whitespace in Expressions](#whitespace-in-expressions)
        8. [Control Structures](#control-structures)
        9. [Function Declarations](#function-declarations)
        10. [Variable Declarations](#variable-declarations)
        11. [Other Recommendations](#other-recommendations)
  2. [Naming Conventions](#naming-conventions)
        1. [Naming Styles](#naming-styles)
        2. [Names to Avoid](#names-to-avoid)
        3. [Contract and Library Names](#contract-and-library-names)
        4. [Struct Names](#struct-names)
        5. [Event Names](#event-names)
        6. [Function Names](#function-names)
        7. [Function Argument Names](#function-argument-names)
        8. [Function Return Parameter Names](#function-return-parameter-names)
        9. [Local and State Variable Names](#local-and-state-variable-names)
        10. [Constants](#constants)
        11. [Modifier Names](#modifier-names)
        12. [Enums](#enums)
        13. [Avoiding Naming Collisions](#avoiding-naming-collisions)
  3. [Best Practices](#best-practices)
        1. [Variable Initialization](#variable-initialization)
        2. [Casting](#casting)
        3. [Require and Assert](#require-and-assert)
        4. [Function Returns](#function-returns)
  4. [Documentation](#documentation)
        1. [Single Line](#single-line)
        2. [Multi Line](#multi-line)
        3. [Structs and Mappings](#structs-and-mappings)
        4. [Spaces](#spaces)
        5. [English Sentence](#english-sentence)
        6. [Grouping](#grouping)
        7. [Alignment](#alignment)
  5. [Comments](#comments)

*The current style guide is mostly based on [Ethereum Solidity Style Guide](http://solidity.readthedocs.io/en/v0.4.24/style-guide.html)
with some changes and additions.*

## Code Layout

### Indentation

Use 4 spaces per indentation level.

### Tabs or Spaces

Only spaces are are allowed as indentation method.

### Blank Lines

Surround top level declarations in solidity source with two blank lines.

`Good`

```solidity
import "Foo.sol"


contract A {
    ...
}


contract B {
    ...
}


contract C {
    ...
}
```

`Bad`

```solidity
contract A {
    ...
}
contract B {
    ...
}

contract C {
    ...
}
```

Within a contract surround function and event declarations with a single blank line.

Blank lines may be omitted between groups of related one-liners (such as stub functions for an abstract contract)

`Good`

```solidity
contract A {
    function spam() public;
    function ham() public;
}

contract B is A {

    function spam() public {
        ...
    }

    function ham() public {
        ...
    }
}
```

`Bad`

```solidity
contract A {

    function spam() public {
        ...
    }
    function ham() public {
        ...
    }
}
```

Within a contract surround event, enum, struct and modifier declarations
with a *single* blank line.

`Example`

```solidity
contract A {

    /* Events */

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);


    /* Structs */

    struct Mint {
        ...
    }

    struct Redemption {
        ...
    }


    /* Modifiers */

    modifier onlyRegistrar() {
        ...
    }

    modifier onlyOwner() {
        ...
    }
}
```

Within a struct, surround documented field declarations with a *single* blank
line.

`Example`

```solidity
/**
 * Message stores the message content as well as additional data about the
 * sender and the receiver. This way, it can be verified that the message has
 * not been manipulated.
 */
struct Message {
    /**
     * The message content bytes encoded.
     * The string encoding must be UTF-8.
     */
    bytes32 message;

    /** Address where the message should be sent to. */
    address receiver;

    /** Address of the account that created this message. */
    address sender;

    /**
     * The signature is created by the sender and is the signed hash of the
     * message: sha3(message, receiver, sender).
     */
    bytes32 signature;
}
```

Section declarations should follow with a single blank line:

`Good`

```solidity
contract A {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);


    /* Public Functions */

    function spam() public {
        ...
    }

    function ham() public {
        ...
    }
}
```

`Bad`

```solidity
contract A {

    /* Events */
    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);
}

contract A {

    /* Events */


    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);
}
```

Surround declaration groups (using sections, event sections, function sections, etc)
in solidity contract with *two* blank lines.

`Good`

```solidity
contract A {

    /* Usings */

    using SafeMath for uint256;


    /* Events */

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);

    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);


    /* Public Functions */

    function spam() public {
        ...
    }

    function ham() public {
        ...
    }


    /* Private Functions */

    function foo() {
        ...
    }
}
```

`Bad`

```solidity
contract A {

    /* Usings */

    using SafeMath for uint256;
    /* Events */

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);

    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);
}

contract A {

    /* Usings */

    using SafeMath for uint256;

    /* Events */

    event StakeRequested(address _staker, uint256 _amount, address _beneficiary);

    event StakeRequestReverted(address _staker, uint256 _amount);

    event StakeRequestRejected(address _staker, uint256 _amount, uint8 _reason);
}
```

### Maximum Line Length

Keeping lines to a maximum of 79 characters helps readers easily parse the code.

Wrapped lines should conform to the following guidelines.

- The first argument should not be attached to the opening parenthesis.
- One, and only one, indent should be used.
- Each argument should fall on its own line.
- The terminating element `);` , should be placed on the final line by itself.

Function Calls

`Good`

```solidity
thisFunctionCallIsReallyLong(
    longArgument1,
    longArgument2,
    longArgument3
);
```

`Bad`

```solidity
thisFunctionCallIsReallyLong(longArgument1,
                                longArgument2,
                                longArgument3
);

thisFunctionCallIsReallyLong(
        longArgument1,
        longArgument2,
        longArgument3
);

thisFunctionCallIsReallyLong(longArgument1,
    longArgument2,
    longArgument3
);

thisFunctionCallIsReallyLong(
    longArgument1, longArgument2,
    longArgument3
);

thisFunctionCallIsReallyLong(
longArgument1,
longArgument2,
longArgument3
);

thisFunctionCallIsReallyLong(
    longArgument1,
    longArgument2,
    longArgument3);
```

Assignment Statements

`Good`

```solidity
thisIsALongNestedMapping[being][set][to_some_value] = someFunction(
    argument1,
    argument2,
    argument3,
    argument4
);
```

`Bad`

```solidity
thisIsALongNestedMapping[being][set][to_some_value] = someFunction(argument1,
                                                                    argument2,
                                                                    argument3,
                                                                    argument4);
```

Event Definitions and Event Emitters

`Good`

```solidity
event LongAndLotsOfArgs(
    address sender,
    address recipient,
    uint256 publicKey,
    uint256 amount,
    bytes32[] options
);

emit LongAndLotsOfArgs(
    sender,
    recipient,
    publicKey,
    amount,
    options
);
```

`Bad`

```solidity
event LongAndLotsOfArgs(address sender,
                        address recipient,
                        uint256 publicKey,
                        uint256 amount,
                        bytes32[] options);

LongAndLotsOfArgs(sender,
                    recipient,
                    publicKey,
                    amount,
                    options);
```

### Imports

Import statements should always be placed at the top of the file.

`Good`

```solidity
import "owned";


contract A {
    ...
}


contract B is owned {
    ...
}
```

`Bad`

```solidity
contract A {
    ...
}


import "owned";


contract B is owned {
    ...
}
```

### Order of Declarations

Ordering helps readers identify which functions they can call
and to find the constructor and fallback definitions easier.

Hence, functions should be grouped according to their visibility and ordered:

- constructor
- fallback function (if exists)
- external functions
- public functions
- internal functions
- private functions

Within a grouping, place the `view` and `pure` functions last.

To read contract top down the following order is suggested:

- using
- event
- enum
- struct
- public variables
- internal variables
- private variables
- modifiers
- functions
  - constructor
  - fallback function (if exists)
  - external functions
  - public functions
  - internal functions
  - private functions

### Whitespace in Expressions

Avoid extraneous whitespace in the following  situations:

Immediately inside parenthesis, brackets or braces, with the exception of
single line function declarations.

`Good`

```solidity
spam(ham[1], Coin({name: "ham"}));
```

`Bad`

```solidity
spam( ham[ 1 ], Coin( { name: "ham" } ) );
```

`Exception`

```solidity
function singleLine() public { spam(); }
```

Immediately before a comma, semicolon:

`Good`

```solidity
function spam(uint i, Coin coin) public;
```

`Bad`

```solidity
function spam(uint i , Coin coin) public ;
```

More than one space around an assignment or other operator to align with another:

`Good`

```solidity
x = 1;
y = 2;
long_variable = 3;
```

`Bad`

```solidity
x             = 1;
y             = 2;
long_variable = 3;
```

Don't include a whitespace in the fallback function:

`Good`

```solidity
function() external {
    ...
}
```

`Bad`

```solidity
function () external {
    ...
}
```

### Control Structures

The braces denoting the body of a contract, library, functions and structs should:

- open on the same line as the declaration
- close on their own line at the same indentation level as the beginning of the
  declaration.
- opening brace should be proceeded by a single space.

`Good`

```solidity
contract Coin {
    struct Bank {
        address owner;
        uint balance;
    }
}
```

`Bad`

```solidity
contract Coin
{
    struct Bank {
        address owner;
        uint balance;
    }
}
```

The same recommendations apply to the control structures `if`, `else`, `while`,
and `for`.

Additionally there should be a single space between the control structures
`if`, `while`, and `for` and the parenthetic block representing the
conditional, as well as a single space between the conditional parenthetic
block and the opening brace.

`Good`

```solidity
if (...) {
    ...
}

for (...) {
    ...
}
```

`Bad`

```solidity
if (...)
{
    ...
}

while(...){
}

for (...) {
    ...;}
```

Above rules apply for control structures whose body contains a single statement

`Good`

```solidity
if (x < 10) {
    x += 1;
}
```

`Bad`

```solidity
if (x < 10)
    x += 1;
```

For `if` blocks which have an `else` or `else if` clause, the `else` should be
placed on the same line as the `if`'s closing brace. This is an exception compared
to the rules of other block-like structures.

`Good`

```solidity
if (x < 3) {
    x += 1;
} else if (x > 7) {
    x -= 1;
} else {
    x = 5;
}


if (x < 3)
    x += 1;
else
    x -= 1;
```

`Bad`

```solidity
if (x < 3) {
    x += 1;
}
else {
    x -= 1;
}
```

### Function Declarations

For short function declarations, it is recommended to keep arguments on the same line
with opening brace of the function body ([Maximum Line Length](#maximum-line-length)
rule should be kept).

The closing brace should be at the same indentation level as the function
declaration.

The opening brace should be preceded by a single space.

`Good`

```solidity
function increment(uint x) public pure returns (uint) {
    return x + 1;
}

function increment(uint x) public pure onlyowner returns (uint) {
    return x + 1;
}
```

`Bad`

```solidity
function increment(uint x) public pure returns (uint)
{
    return x + 1;
}

function increment(uint x) public pure returns (uint){
    return x + 1;
}

function increment(uint x) public pure returns (uint) {
    return x + 1;
    }

function increment(uint x) public pure returns (uint) {
    return x + 1;}
```

For long function declarations, it is recommended to drop each argument onto
it's own line at the same indentation level as the function body.  The closing
parenthesis and opening bracket should be placed on their own line as well at
the same indentation level as the function declaration.

`Good`

```solidity
function thisFunctionHasLotsOfArguments(
    address a,
    address b,
    address c,
    address d,
    address e,
    address f
)
    public
{
    doSomething();
}
```

`Bad`

```solidity
function thisFunctionHasLotsOfArguments(address a, address b, address c,
    address d, address e, address f) public {
    doSomething();
}

function thisFunctionHasLotsOfArguments(address a,
                                        address b,
                                        address c,
                                        address d,
                                        address e,
                                        address f) public {
    doSomething();
}

function thisFunctionHasLotsOfArguments(
    address a,
    address b,
    address c,
    address d,
    address e,
    address f) public {
    doSomething();
}
```

If a long function declaration has modifiers, then each modifier should be
dropped to its own line.

`Good`

```solidity
function thisFunctionNameIsReallyLong(address x, address y, address z)
    public
    onlyowner
    priced
    returns (address)
{
    doSomething();
}

function thisFunctionNameIsReallyLong(
    address x,
    address y,
    address z,
)
    public
    onlyowner
    priced
    returns (address)
{
    doSomething();
}
```

`Bad`

```solidity
function thisFunctionNameIsReallyLong(address x, address y, address z)
                                        public
                                        onlyowner
                                        priced
                                        returns (address) {
    doSomething();
}

function thisFunctionNameIsReallyLong(address x, address y, address z)
    public onlyowner priced returns (address)
{
    doSomething();
}

function thisFunctionNameIsReallyLong(address x, address y, address z)
    public
    onlyowner
    priced
    returns (address) {
    doSomething();
}
```

Multi-line output parameters and return statements should follow the same style
recommended for wrapping long lines found in the [Maximum Line Length](#maximum_line_length) section.

`Good`

```solidity
function thisFunctionNameIsReallyLong(
    address a,
    address b,
    address c
)
    public
    returns (
        address someAddressName,
        uint256 LongArgument,
        uint256 Argument
    )
{
    doSomething()

    return (
        veryLongReturnArg1,
        veryLongReturnArg2,
        veryLongReturnArg3
    );
}
```

`Bad`

```solidity
function thisFunctionNameIsReallyLong(
    address a,
    address b,
    address c
)
    public
    returns (address someAddressName,
                uint256 LongArgument,
                uint256 Argument)
{
    doSomething()

    return (veryLongReturnArg1,
            veryLongReturnArg1,
            veryLongReturnArg1);
}
```

For constructor functions on inherited contracts whose bases require arguments,
it is recommended to drop the base constructors onto new lines in the same
manner as modifiers if the function declaration is long or hard to read.

`Good`

```solidity
contract A is B, C, D {
    constructor(uint param1, uint param2, uint param3, uint param4, uint param5)
        B(param1)
        C(param2, param3)
        D(param4)
        public
    {
        // do something with param5
    }
}
```

`Bad`

```solidity
contract A is B, C, D {
    constructor(uint param1, uint param2, uint param3, uint param4, uint param5)
    B(param1)
    C(param2, param3)
    D(param4)
    public
    {
        // do something with param5
    }
}

contract A is B, C, D {
    constructor(uint param1, uint param2, uint param3, uint param4, uint param5)
        B(param1)
        C(param2, param3)
        D(param4)
        public {
        // do something with param5
    }
}
```

When declaring short functions with a single statement, it is permissible to do it on a single line.

`Permissible`

```solidity
function shortFunction() public { doSomething(); }
```

You should explicitly label the visibility of all functions, including constructors.

`Good`

```solidity
function explicitlyPublic(uint val) public {
    doSomething();
}
```

`Bad`

```solidity
function implicitlyPublic(uint val) {
    doSomething();
}
```

The visibility modifier for a function should come before any custom
modifiers.

`Good`

```solidity
function kill() public onlyowner {
    selfdestruct(owner);
}
```

`Bad`

```solidity
function kill() onlyowner public {
    selfdestruct(owner);
}
```

### Variable Declarations

Declarations of array variables should not have a space between the type and
the brackets.

`Good`

```solidity
uint[] x;
```

`Bad`

```solidity
uint [] x;
```

### Other Recommendations

Strings should be quoted with double-quotes instead of single-quotes.

`Good`

```solidity
str = "foo";
str = "Hamlet says, 'To be or not to be...'";
```

`Bad`

```solidity
str = 'bar';
str = '"Be yourself; everyone else is already taken." -Oscar Wilde';
```

Surround operators with a single space on either side.

`Good`

```solidity
x = 3;
x = 100 / 10;
x += 3 + 4;
x |= y && z;
```

`Bad`

```solidity
x=3;
x = 100/10;
x += 3+4;
x |= y&&z;
```

## Naming Conventions

Naming conventions are powerful when adopted and used broadly.  The use of
different conventions can convey significant *meta* information that would
otherwise not be immediately available.

The naming recommendations given here are intended to improve the readability,
and thus they are not strict rules, but rather guidelines to try and help convey the
most information through the names of things.

Lastly, consistency within a codebase should always supersede any conventions
outlined in this document.

### Naming Styles

To avoid confusion, the following names will be used to refer to different
naming styles.

- `b` (single lowercase letter)
- `B` (single uppercase letter)
- `lowercase`
- `lower_case_with_underscores`
- `UPPERCASE`
- `UPPER_CASE_WITH_UNDERSCORES`
- `CapitalizedWords` (or CapWords)
- `mixedCase` (differs from CapitalizedWords by initial lowercase character!)
- `Capitalized_Words_With_Underscores`

    `NOTE:` When using initialism in CapWords, capitalize all the letters of the
    initialism. Thus HTTPServerError is better than HttpServerError.
    When using initialism is mixedCase, capitalize all the letters of the
    initialism, except keep the first one lower case if it is the
    beginning of the name. Thus xmlHTTPRequest is better than XMLHTTPRequest.

### Names to Avoid

- `l` - Lowercase letter el
- `O` - Uppercase letter oh
- `I` - Uppercase letter eye

Never use any of these for single letter variable names.  They are often
indistinguishable from the numerals one and zero.

### Contract and Library Names

Contracts and libraries should be named using the CapWords style.

`Example`

    SimpleToken, MerklePatriciaProof, OpenSTValueInterface

Libraries' names should not include `Lib` prefix/postfix.

`Good`

    SafeMath, UpradableProxy

`Bad`

    SafeMathLib, LibUpgradableProxy

### Struct Names

Structs should be named using the CapWords style.

`Example`

    MyCoin, Position

### Event Names

Events should be named using the CapWords style.

`Example`

    Deposit, Transfer, Approval, BeforeTransfer, AfterTransfer

### Function Names

Functions should use mixedCase.

`Example`

    getBalance, transfer, verifyOwner, addMember, changeOwner

### Function Argument Names

Function arguments should use mixedCase and start with underscore.

`Example`

    _initialSupply, _account, _recipientAddress

```solidity
function requestStake(
    uint256 _amount,
    address _beneficiary
)
    external
    returns (bool)
{
    ...
}
```

When writing library functions that operate on a custom struct, the struct
should be the first argument and should always be named `self`.

### Function Return Parameter Names

Function named return parameters should use mixedCase and end with underscore.

`Example`

    winningProposal_, winnerName_

```solidity
function winningProposal()
    public
    view
    returns (uint winningProposal_)
{
    uint winningVoteCount = 0;
    for (uint p = 0; p < proposals.length; p++) {
        if (proposals[p].voteCount > winningVoteCount) {
            winningVoteCount = proposals[p].voteCount;
            winningProposal_ = p;
        }
    }
}
```

### Local and State Variable Names

Both variable types follow mixedCase naming style.

`Example`

    totalSupply, remainingSupply, balancesOf, creatorAddress, isPreSale, tokenExchangeRate

### Constants

Constants should be named with all capital letters with underscores separating
words.

`Example`

    MAX_BLOCKS, TOKEN_NAME, TOKEN_TICKER, CONTRACT_VERSION

### Modifier Names

Use mixedCase.

`Example`

    onlyBy, onlyAfter, onlyDuringThePreSale

### Enums

Enums, in the style of simple type declarations, should be named using the
CapWords style.

`Example`

    TokenGroup, Frame, HashStyle, CharacterLocation

### Avoiding Naming Collisions

`single_trailing_underscore_`

This convention is suggested when the desired name collides with that of a
built-in or otherwise reserved name.

## Best Practices

### Variable Initialization

Variables should be always initialized.

`Example`

```solidity
function spam() internal {
    ...
    uint256 index = 0;
    bool isEmpty = false;
    ...
}
```

### Casting

For non primitive types we do not rely on implicit casting and specify
constructor call explicitly.

`Good`

```solidity
function spam(address a, bytes32 b, uint i) internal {
    ...
    require(a != address(0));
    require(b != bytes32(0));
    require(i != 0);
    ...
}
```

`Bad`

```solidity
function spam(address a, bytes32 b) internal {
    ...
    require(a != 0);
    require(b != 0);
    ...
}
```

### Require and Assert

Use `assert(condition, message)` if you never ever want the condition to be `false`, not in any circumstance
(apart from a bug in your code). It checks for invariants in code.

Use `require(condition, message)` if condition can be `false`, due to e.g. invalid input,
contract state variables are not met, a failing external component.

Specifying *message* parameter for `require` is mandatory.
For `assert` use your best judgement.

### Function Returns

Solidity allows named return parameters.

`Example`

```solidity
function winningProposal()
    public
    view
    returns (uint winningProposal_)
{
    uint winningVoteCount = 0;
    for (uint p = 0; p < proposals.length; p++) {
        if (proposals[p].voteCount > winningVoteCount) {
            winningVoteCount = proposals[p].voteCount;
            winningProposal_ = p;
        }
    }
}
```

We encourage to use named return parameters in all cases except the obvious ones, like:

`Example`

```solidity
function winnerName()
    public
    view
    returns (bytes32 winnerName_)
{
    winnerName_ = proposals[winningProposal()].name;
}
```

In above example, one could use unnamed return parameter:

```solidity
function winnerName()
    public
    view
    returns (bytes32)
{
    return proposals[winningProposal()].name;
}
```

`NOTE` Multiple return parameters should be always named one.

Only **empty** `return` statements are allowed from functions with named return parameters.
This should be only used for early returns. Otherwise, no `return` statement.

## Documentation

Solidity contracts, functions, enums, etc documentation follows
[Ethereum Natural Specification](https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format) format.

Documentation is inserted above the object following the doxygen notation of a
multi-line comment starting with `/**` and ending with `*/`.

Documentation starting with `///` style should be avoided.

Avoid using `@author` documentation tag.

### Single Line

Single line documentation format is:

`Good`

```solidity
/** @notice Returns storage root at the specified block height. */
function getStorageRoot(uint256 _blockHeight)
    public
    view
    returns (bytes32 /* storage root */)
{
    ...
}

/** Bounty amount to take from facilitator on accepting stake. */
uint256 public bounty;
```

`Bad`

```solidity
/**
 * @notice Returns storage root at the specified block height.
 */
function getStorageRoot(uint256 _blockHeight)
    public
    view
    returns (bytes32 /* storage root */)
{
    ...
}

/**
 * Bounty amount to take from facilitator on accepting stake.
 */
uint256 public bounty;
```

### Multi Line

Multi line documentation format is:

`Example`

```solidity
/**
 * @notice Returns storage root at the specified block height.
 *
 * @param _blockHeight Block height to return storage root.
 *
 * @return bytes32(0) if a storage root for specified block height was not
 *         verified otherwise saved storage root.
 */
function getStorageRoot(uint256 _blockHeight)
    public
    view
    returns (bytes32)
{
    ...
}
```

### Structs and Mappings

Document structs above the struct declaration.
Document struct fields above the respective field.

`Good`

```solidity
/** A Bank has a single owner. You need to create one bank per person. */
struct Bank {
    /** The owner of the bank functions simultaniously as the owner of the funds in balance. */
    address owner;

    /** The balance of the owner in Ethereum Wei. */
    uint256 balance;
}

/**
 * Message stores the message content as well as additional data about the
 * sender and the receiver. This way, it can be verified that the message has
 * not been manipulated.
 */
struct Message {
    /**
     * The message content bytes encoded.
     * The string encoding must be UTF-8.
     */
    bytes32 message;

    /** Address where the message should be sent to. */
    address receiver;

    /** Address of the account that created this message. */
    address sender;

    /**
     * The signature is created by the sender and is the signed hash of the
     * message: sha3(message, receiver, sender).
     */
    bytes32 signature;
}
```

`Bad`

```solidity
/** A Bank has a single owner. You need to create one bank per person. */
struct Bank {
    address owner; /** The owner of the bank functions simultaniously as the owner of the funds in balance. */
    uint256 balance; // The balance of the owner in Ethereum Wei.
}
```

Document mappings above the mappings' respective declaration.

`Good`

```solidity
/** balances stores per address the total balance in SimpleToken Wei. */
mapping (address => uint) public balances;
```

`Bad`

```solidity
mapping (address => uint) public balances; /** balances stores per address the total balance in SimpleToken Wei. */
mapping (address => uint) public balances; // balances stores per address the total balance in SimpleToken Wei.
```

### Spaces

Put a single space after and before documentation tag.

`Good`

```solidity
/**
 * @notice Get the token balance for account _tokenOwner.
 *
 * @param _tokenOwner Token owner address to retrieve the balance.
 */
function balanceOf(address _tokenOwner) public constant returns (uint) {
    return balances[_tokenOwner];
}
```

`Bad`

```solidity
/**
 *  @notice Get the token balance for account _tokenOwner.
 *
 * @param  tokenOwner Token owner address to retrieve the balance.
 */
function balanceOf(address _tokenOwner) public constant returns (uint balance) {
    return balances[_tokenOwner];
}
```

### English Sentence

All documentations starts with capital letter and end with `'.'` (dot).

`Good`

```solidity
/**
 * @notice Returns storage root at the specified block height.
 *
 * @param _blockHeight Block height to return storage root.
 *
 * @return bytes32(0) if a storage root for specified block height was not
 *          verified otherwise saved storage root.
 */
function getStorageRoot(uint256 _blockHeight)
    public
    view
    returns (bytes32)
{
    ...
}
```

`Bad`

```solidity
/**
 * @notice returns storage root at the specified block height.
 *
 * @param _blockHeight Block height to return storage root
 *
 * @return bytes32(0) If a storage root for specified block height was not
 *          verified otherwise saved storage root.
 */
function getStorageRoot(uint256 _blockHeight)
    public
    view
    returns (bytes32)
{
    ...
}
```

### Grouping

No new line between the same documentation tags:

`Good`

```solidity
/**
 * @notice Commit new state root for a specified block height.
 *
 * @param _blockHeight Block height for which stateRoots mapping needs to update.
 * @param _stateRoot State root of input block height.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot)
    external
    onlyWorker
    returns(bool);
```

`Bad`

```solidity
/**
 * @notice Commit new state root for a specified block height.
 *
 * @param _blockHeight Block height for which stateRoots mapping needs to update.
 *
 * @param _stateRoot State root of input block height.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot)
    external
    onlyWorker
    returns(bool);
```

Put a single blank line between documentation tags (tag groups).

`Good`

```solidity
/**
 * @notice Commit new state root for a specified block height.
 *
 * @param _blockHeight Block height for which stateRoots mapping needs to update.
 * @param _stateRoot State root of input block height.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot)
    external
    onlyWorker
    returns(bool);
```

`Bad`

```solidity
/**
 * @notice Commit new state root for a specified block height.
 * @param _blockHeight Block height for which stateRoots mapping needs to update.
 * @param _stateRoot State root of input block height.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function commitStateRoot(uint256 _blockHeight, bytes32 _stateRoot)
    external
    onlyWorker
    returns(bool);
```

### Alignment

Align documentation within same tag (not group).

`Good`

```solidity
/**
 * @dev Allow _spender to withdraw from your account, multiple times, up to the
 *      _value amount. If this function is called again it overwrites the current
 *      allowance with _value.
 *
 * @param _spender Address to approve to withdraw.
 * @param _value Amount to approve for withdrawal.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function approve(address _spender, uint256 _value) returns (bool success);
```

`Bad`

```solidity
/**
 * @dev Allow _spender to withdraw from your account, multiple times, up to the
 * _value amount. If this function is called again it overwrites the current
 * allowance with _value.
 *
 * @param _spender Address to approve to withdraw.
 * @param _value Amount to approve for withdrawal.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function approve(address _spender, uint256 _value) returns (bool success);

/**
 * @dev Allow _spender to withdraw from your account, multiple times, up to the
 *      _value amount. If this function is called again it overwrites the current
 *      allowance with _value.
 *
 * @param _spender Address to approve to withdraw.
 * @param _value   Amount to approve for withdrawal.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function approve(address _spender, uint256 _value) returns (bool success);
```

### Multiple Return Parameters

Use the following format for multiple return parameter documentation.

`Example`

```solidity
/**
 * Calculates sum and production.
 *
 * @param _a First input to calculate sum and production.
 * @param _b Second input to calculate sum and production.
 *
 * @return sum_ Sum of the input arguments.
 * @return product_ Product of the input arguments.
 *                  It's really product of the input arguments.
 */
function arithmetics(uint _a, uint _b)
    public
    pure
    returns (uint sum_, uint product_)
{
    sum_ = _a + _b;
    product_ = _a * _b;
}
```

`NOTE` The order of documenting the return parameters should be the same as a return order.

`NOTE` No blank line between documentation of individual input parameters.

`NOTE` Return parameter alignment should be the same as for function arguments.

## Comments

It's recommended to use for code commenting the `//`.

Comments should start with capital letter and end with `'.'` (dot) as an
ordinary English sentence.

Put a single space after `//` in comments.

`NOTE:`

    Commenting happens only inside functions.

`Good`

```solidity
/**
 * @dev Bounty amount is transferred to msg.sender if msg.sender is
 *      not a whitelisted worker. Otherwise it is transferred to workers contract.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function processStaking(
    bytes32 _stakingIntentHash,
    bytes32 _unlockSecret
)
    external
    returns (bool)
{
    ...

    // Checks if the stake request exists.
    require(stakeRequest.beneficiary != address(0));

    // Checks if the stake request was accepted.
    require(stakeRequest.hashLock != bytes32(0));

    ...
}
```

`Bad`

```solidity
/**
 * @dev Bounty amount is transferred to msg.sender if msg.sender is
 *      not a whitelisted worker. Otherwise it is transferred to workers contract.
 *
 * @return bool true in case of success, otherwise throws an exception.
 */
function processStaking(
    bytes32 _stakingIntentHash,
    bytes32 _unlockSecret
)
    external
    returns (bool)
{
    ...

    // checks if the stake request exists
    require(stakeRequest.beneficiary != address(0));

    /* Require _stakingIntentHash to be non-zero. */
    require(_stakingIntentHash != bytes32(0));

    /*
     * Checks if the stake request was accepted.
     */
    require(stakeRequest.hashLock != bytes32(0));

    ...
}
```
