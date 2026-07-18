
# Advanced Smart Contract Concepts with Solidity and Rust

In this tutorial, we will cover advanced Solidity and Rust concepts such as inheritance, interfaces, libraries, and modifiers. Additionally, we will learn how to write safe and efficient Rust code for smart contracts. Finally, we will learn how to convert common Solidity concepts to Rust.

## Table of Contents

1. [Advanced Solidity Concepts](#advanced-solidity-concepts)
2. [Advanced Rust Concepts](#advanced-rust-concepts)
3. [Writing Safe and Efficient Rust Code for Smart Contracts](#writing-safe-and-efficient-rust-code-for-smart-contracts)
4. [Solidity to Soroban: Common Concepts and Best Practices](#solidity-to-soroban-common-concepts-and-best-practices)

## Advanced Solidity Concepts

### Inheritance

In Solidity, smart contracts can inherit properties and functions from other contracts. This is achieved using the `<span>is</span>` keyword.

Here is an example of a parent contract that defines a function called `<span>messageFromParent</span>` that returns a string:

```
contract Parent {
    function messageFromParent() public pure returns (string memory) {
        return "Hello from Parent";
    }
}
contract Child is Parent {
    function messageFromChild(string memory newMessage) public pure returns (string memory) {
        string memory messageFromParent = messageFromParent();
        return string(abi.encodePacked(messageFromParent,', ', newMessage));
    }
}
```

In this example, the `<span>Child</span>` contract inherits the `<span>messageFromParent</span>` function from the `<span>Parent</span>` contract. The `<span>Child</span>` contract can then call the `<span>messageFromParent</span>` function directly.

### Interfaces

Interfaces are similar to contracts, but they cannot have any function implementations. They only contain function signatures. Contracts can implement interfaces using the `<span>is</span>` keyword, similar to inheritance.

Here is an example of an interface that defines a function called `<span>doSomething</span>` that returns a `<span>uint256</span>`:

```
interface SomeInterface {
    function doSomething() external returns (uint256);
}

contract SomeContract is SomeInterface {
    uint256 private counter;

    function doSomething() external override returns (uint256) {
        counter += 1;
        return counter;
    }
}
```

In this example, the `<span>SomeContract</span>` contract implements the `<span>SomeInterface</span>` interface. Its implementation returns a `<span>u256</span>` that is incremented each time the `<span>doSomething</span>` function is called.

### Libraries

Libraries are similar to contracts, but they cannot have any state variables. They are used to store reusable code that can be used by other contracts. Libraries are deployed once and can be used by multiple contracts. They are defined using the `<span>library</span>` keyword. They are invoked by using the `<span>using</span>` keyword.

```
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "Addition overflow");

        return c;
    }
}

contract MyContract {
    using SafeMath for uint256;

    uint256 public value;

    function increment(uint256 amount) public {
        value = value.add(amount);
    }
}
```

In this example, the `<span>SafeMath</span>` library is used in the `<span>increment</span>` function. The `<span>increment</span>` function uses the `<span>add</span>` function from the `<span>SafeMath</span>` library to increment the `<span>value</span>` variable.

### Modifiers

Modifiers are used to change the behavior of functions in a declarative way. They are defined using the `<span>modifier</span>` keyword. Modifiers can be used to perform common checks such as validating inputs, checking permissions, and more.

```
contract Ownable {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }
}

contract MyContract is Ownable {
    function doSomething() public onlyOwner {
        // This function can only be called by the owner of the contract
    }
}
```

In this example, the `<span>onlyOwner</span>` modifier is used to restrict access to the `<span>doSomething</span>` function. The `<span>doSomething</span>` function can only be called by the `<span>owner</span>` of the contract which was defined during deployment as `<span>msg.sender</span>`.

## Advanced Rust Concepts

### Crates

A crate in Rust is a collection of precompiled programs, scripts, or routines that can be easily reused by programmers when writing code. This allows them to avoid reinventing the wheel by not having to implement the same logic or program multiple times. There are two types of crates in Rust: [Binary crates and Library crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html).

Binary crates are crates that can be executed as standalone programs. Library crates are crates that are meant to be used by other programs. Library crates can be imported into other programs using the `<span>use</span>` keyword.

Here is an example of a workflow that implements allocation (`<span>alloc</span>`) logic within a smart contract:

First a user would include the `<span>alloc</span>` crate in their `<span>Cargo.toml</span>` file:

```
[dependencies]
soroban-sdk = { workspace = true, features = ["alloc"] }

[dev_dependencies]
soroban-sdk = { workspace = true, features = ["testutils", "alloc"] }
```

Then they would import the `<span>alloc</span>` crate into their smart contract:

```
// Imports
#![no_std]
use soroban_sdk::{contractimpl, Env};

extern crate alloc;

#[contract]
pub struct AllocContract;

#[contractimpl]
impl AllocContract {
    /// Allocates a temporary vector holding values (0..count), then computes and returns their sum.
    pub fn sum(_env: Env, count: u32) -> u32 {
        let mut v1 = alloc::vec![];
        (0..count).for_each(|i| v1.push(i));

        let mut sum = 0;
        for i in v1 {
            sum += i;
        }

        sum
    }
}
```

In this example, the `<span>alloc</span>` crate is imported into the smart contract using the `<span>extern crate alloc;</span>` statement. The `<span>alloc</span>` crate is then used to create a temporary vector that holds values from 0 to `<span>count</span>`. The values in the vector are then summed and returned.

For more details on how to use the `<span>alloc</span>` crate, including a hands-on practical exercise, visit the [alloc example contract](https://developers.stellar.org/docs/build/smart-contracts/example-contracts/alloc.md#how-it-works).

#### Inheriting Functionality from Other Crates

We can illustrate another example of inheritance by importing functionality into a crate from other crates in the same project in the following example:

Below is a function from the `<a href="https://github.com/stellar/soroban-examples/tree/main/events/src"><span>event.rs</span></a>` file from our [Token](https://github.com/stellar/soroban-examples/tree/main/token) example.

```
use soroban_sdk::{Address, Env, Symbol};
...
pub(crate) fn mint(e: &Env, admin: Address, to: Address, amount: i128) {
    let topics = (symbol_short!("mint"), admin, to);
    e.events().publish(topics, amount);
}
```

This function will publish a mint event to the blockchain with the following output:

```
Emit event with topics = ["mint", admin: Address, to: Address], data = amount: i128
```

We'll also use a function from our `<a href="https://github.com/stellar/soroban-examples/blob/main/token/src/admin.rs"><span>admin.rs</span></a>` file.

```
// Metering: covered by components
pub fn read_administrator(e: &Host) -> Result<Address, HostError> {
    let key = DataKey::Admin;
    let rv = e.get_contract_data(key.try_into_val(e)?)?;
    Ok(rv.try_into_val(e)?)
}
```

This function returns a `<span>Result</span>` object that contains the administrator's address.

Lastly, we'll implement a function from our `<a href="https://github.com/stellar/soroban-examples/blob/main/token/src/balance.rs"><span>balance.rs</span></a>` file.

```
pub fn receive_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    if !is_authorized(e, addr.clone()) {
        panic!("can't receive when deauthorized");
    }
    write_balance(e, addr, balance + amount);
}
```

This function writes an amount to an address' balance.

The `<span>event.rs</span>` is imported into the `<a href="https://github.com/stellar/soroban-examples/blob/main/token/src/contract.rs"><span>contract.rs</span></a>` file which holds the logic for our token contract.

```
//contract.rs

//imports
use crate::event;
use crate::admin::{read_administrator};
use crate::balance::{receive_balance};

// trait logic
pub trait TokenTrait {
fn mint(e: Env, to: Address, amount: i128);
}

// struct logic
#[contract]
pub struct Token;

// impl logic

#[contractimpl]
impl TokenTrait for Token {
fn mint(e: Env, to: Address, amount: i128) {
        check_nonnegative_amount(amount);
        let admin = read_administrator(&e);
        admin.require_auth();
        receive_balance(&e, to.clone(), amount);
        event::mint(&e, admin, to, amount);
    }
}
```

As you can see, the `<span>event.rs</span>`, `<span>admin.rs</span>`, and `<span>balance.rs</span>` files are imported into the `<span>contract.rs</span>` file using the `<span>use</span>` keyword. This allows us to use the functions from those files in the `<span>mint</span>` function of our `<span>contract.rs</span>` file.

#### Inheriting Functionality using `<span>contractimport!</span>`

The Soroban Rust SDK provides a powerful macro, `<a href="https://docs.rs/soroban-sdk/latest/soroban_sdk/macro.contractimport.html"><span>contractimport</span></a>`, which allows a user to import a contract from its Wasm file, generating a client, types, and constant holding the contract file.

Here is an example of how to use the `<span>contractimport</span>` macro taken from the token.rs file from our [Liquidity Pool example](https://github.com/stellar/soroban-examples/blob/main/liquidity_pool):

First, we see that the wasm file from the [previously built token example](https://github.com/stellar/soroban-examples/blob/main/token) is imported into the `<span>token.rs</span>` file using the `<span>contractimport</span>` macro:

```
//token.rs
soroban_sdk::contractimport!(
    file = "../token/target/wasm32v1-none/release/soroban_token_contract.wasm"
);
```

We see then that our token contract is imported into our `<a href="https://github.com/stellar/soroban-examples/blob/main/liquidity_pool/src/lib.rs"><span>lib.rs</span></a>` file and a `<span>Client</span>` is generated for us to access functionality from the token contract:

```
//lib.rs
mod token;

fn get_balance(e: &Env, contract_id: BytesN<32>) -> i128 {
    token::Client::new(e, &contract_id).balance(&e.current_contract_address())
}

fn transfer(e: &Env, contract_id: BytesN<32>, to: Address, amount: i128) {
    token::Client::new(e, &contract_id).transfer(&e.current_contract_address(), &to, &amount);
}

struct LiquidityPool;

#[contractimpl]
impl LiquidityPoolTrait for LiquidityPool {
    let token_a_client = token::Client::new(&e, &get_token_a(&e));
}
```

In the above example, we use `<span>contractimport</span>` to interact with the token file via a `<span>Client</span>` that was generated for the `<span>token</span>` module. This `<span>Client</span>` was created using a Contract trait that matches the interface of the contract, a ContractClient struct that contains functions for each function in the contract, and types for all contract types defined in the contract.

#### A Note on Inheritance and Composability

While we've been using the term "inheritance" to help make the transition from Solidity smoother, let's clarify an important aspect of Rust: it does not support inheritance as we traditionally understand it. Instead, Rust practices "composability", meaning it uses functions from different crates, which are akin to packages, in a modular fashion. So, when we discuss `<span>contractimport!</span>`, we're actually observing composability in action, not "inheritance". Rust does not foster the "is a" relationship inherent in OOP languages. Instead, it enables us to reuse and assemble code effectively across different scopes. This is a technical truth that is important to understand; however, it's worth noting that this fact doesn't impact the practical usage of Soroban throughout this guide.

### Modules

In Rust, modules consist of a cohesive set of related functions and types that are often organized together for better organization and reusability. These modules can be reused across multiple projects by publishing them as crates.

Here is an example of a module that implements `<span>SafeMath</span>` logic with an `<span>add</span>` function:

```
#![no_std]

mod safe_math

// mod safe_math {
//     pub fn add(a: u32, b: u32) -> Result<u32, &'static str> {
//          a.checked_add(b).ok_or("Addition overflow")
//      }
// }


// Imports
use soroban_sdk::{contractimpl, Env};
use safe_math::add;

pub trait MathContract {
    fn add(&self, env: Env, a: u32, b: u32) -> u32;
}

#[contract]
pub struct Adder;

impl MathContract for Adder {
    fn add(&self, _env: Env, a: u32, b: u32) -> u32 {
        add(a, b).unwrap()
    }
}

#[contractimpl]
impl Adder {}

// test module
#[cfg(test)]
mod test;
```

Notice that we use the `<span>checked_add</span>` function from the standard library to ensure that the addition does not overflow. This is important because if the addition overflows, it could lead to unexpected behavior in the contract.

Even when Rust code is compiled with the `<span>#![no_std]</span>` flag, it is still possible to use some of the standard library's features, such as the `<span>checked_add</span>` function. This is because Rust provides the option to selectively import modules and functions from the standard library, allowing developers to use only the specific features they need.

### Traits

Rust does not have a built-in modifier system like Solidity. However, you can achieve similar functionality using `<span>traits</span>` and their implementations.

In the example below, we will illustrate the inheritance of traits using the `<span>Ownable</span>` trait.

```
#![no_std]

// Imports
use soroban_sdk::{contracttype, Address};

// Define the `Ownable` trait
trait Ownable {
    fn is_owner(&self, owner: &Address) -> bool;
}

// Implement the `Ownable` trait for the `OwnableContract` struct
impl Ownable for OwnableContract {
    fn is_owner(&self, owner: &Address) -> bool {
        self.owner == *owner
    }
}

// Define a modifier that requires the caller to be the owner of the contract
fn only_owner(contract: &OwnableContract, owner: &Address) -> bool {
    contract.is_owner(owner)
}

// Implement the contract for the `OwnableContract` struct
#[contracttype]

// Define the `OwnableContract` struct
pub struct OwnableContract {
    owner: Address,
    number: u32,
}

impl OwnableContract {
    // Define a public method that requires the caller to be the owner of the contract
    pub fn change_number(&mut self, new_number: u32) {
        if only_owner(self, &self.owner) {
            self.number = new_number;
        }
    }
}

#[cfg(test)]
mod test;
```

Here's a breakdown of the code above:

* First, we define the `<span>Ownable</span>` trait, which defines a single method called `<span>is_owner</span>`. This method takes an `<span>Address</span>` as an argument and returns a boolean value indicating whether or not the address is the owner of the contract.
* Next, we implement the `<span>Ownable</span>` trait for the `<span>OwnableContract</span>` struct. This allows us to use the `<span>is_owner</span>` method on instances of the `<span>OwnableContract</span>` struct.
* Then, we define a "modifier" called `<span>only_owner</span>` that takes an instance of the `<span>OwnableContract</span>` struct and an `<span>Address</span>` as arguments. This "modifier" returns a boolean value indicating whether or not the address is the owner of the contract.
* Finally, we implement the contract for the `<span>OwnableContract</span>` struct. This allows only the `<span>owner</span>` of the contract to use the `<span>change_number</span>` method on instances of the `<span>OwnableContract</span>` struct.

It's worth mentioning that the Soroban Rust SDK comes with several built-in requirements that developers can use, such as the `<a href="https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Address.html#method.require_auth"><span>require_auth</span></a>` method provided by the `<span>Address</span>` struct.

### Interfaces

Interfaces are an essential part of building smart contracts with Soroban.

There are many types of smart contract interfaces, and each has a specific purpose. One example of an interface built with Soroban is the [Token Interface](https://developers.stellar.org/docs/tokens/token-interface.md). This interface ensures that tokens deployed on Soroban are interoperable with Soroban's built-in tokens (such as the Stellar Asset Contract). The Token Interface consists of three compatibility requirements:

* `<span>function interface</span>`
* `<span>authorization</span>`
* `<span>events</span>`

For more information on smart contract interfaces built with Soroban, including the Token Interface, visit the [tokens section](https://developers.stellar.org/docs/tokens.md) of the documentation.

## Writing Safe and Efficient Rust Code for Smart Contracts

When writing Rust code for smart contracts, it's important to focus on safety and efficiency. Some tips include:

* Use the `<a href="https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html"><span>Result</span></a>` type to handle errors in a safe and predictable way. In smart contracts, it's important to avoid panicking, as this can lead to unpredictable behavior. Instead, Result can be used to handle errors and ensure that the contract behaves as expected.

In the example below, the `<span>add</span>` function returns a `<span>Result</span>` type, which can either be `<span>Ok</span>` or `<span>Err</span>`. If the addition does not overflow, the function returns `<span>Ok</span>`, otherwise it returns `<span>Err</span>`.

```
pub fn add(a: u32, b: u32) -> Result<u32, &'static str> {
    a.checked_add(b).ok_or("Addition overflow")
}
```

* Use the `<span>checked_</span>` family of functions, such as `<span>checked_add</span>`, `<span>checked_sub</span>`, etc., to perform arithmetic operations in a safe and efficient manner. These functions check for overflows and underflows and return an error if one occurs.

In the example below, the `<span>add</span>` function uses the `<span>checked_add</span>` function to perform the addition. If the addition overflows, the function returns an error.

```
pub fn add(a: u32, b: u32) -> u32 {
    a.checked_add(b).expect("Addition overflow")
}
```

* Use `<span>cargo</span>` and `<span>clippy</span>` to enforce code quality, style, and efficiency in Rust. `<span>cargo</span>` is Rust's package manager and provides a number of tools for building and testing Rust code. `<span>clippy</span>` is a linter that can help identify potential issues in the code, such as unused variables or functions that could be optimized.

To use clippy with cargo, you'll first need to install it. You can do this by running the following command in your terminal:

```
cargo install clippy
```

Once clippy is installed, you can run it by running the following command in your terminal:

```
cargo clippy
```

This will run clippy on your entire project, checking for potential issues and providing suggestions for improvement. Clippy will output any issues it finds, along with suggestions for how to fix them.

* Use `<span>cargo</span>` and `<span>rustfmt</span>` to enforce code style. `<span>rustfmt</span>` is a tool that can automatically format Rust code according to the Rust style guide. This can help ensure that the code is consistent and easy to read.

To use rustfmt with cargo, you'll first need to install it. You can do this by running the following command in your terminal:

```
cargo install rustfmt
```

Once rustfmt is installed, you can run it by running the following command in your terminal:

```
cargo fmt
```

Before:

```
fn main()
{
let x=5;
if x==5 {
println!("Hello, world!");
}
}
```

After:

```
fn main() {
    let x = 5;
    if x == 5 {
        println!("Hello, world!");
    }
}
```

## Solidity to Soroban: Common Concepts and Best Practices

In this section we will explore key Solidity concepts and provide their Soroban equivalents. We will discuss the following topics:

* Message Properties
* Error Handling
* Address-related functionality
* Function visibility specifiers
* Time-based variables

### Message Properties

The Soroban Rust SDK and Solidity provide a number of message properties that can be used to access information about the current transaction. These properties include:

#### Solidity

* `<span>msg.sender</span>`: The address of the account that sent the transaction.
* `<span>msg.value</span>`: The amount of Ether sent with the transaction.
* `<span>msg.data</span>`: The data sent with the transaction.

Here's a simple example of a smart contract that demonstrates the use of each

```
pragma solidity ^0.8.0;

contract SimpleContract {
    address public sender;
    uint public value;
    bytes public data;

    // Caller must send Ether and data to this function.
    // This function will store the sender, value, and data.
    function sendData(bytes calldata _data) external payable {
        sender = msg.sender;
        value = msg.value;
        data = _data;
    }
}
```

These are a part of Solidity's global variables, which are accessible from any function in the contract.

#### Soroban

In contrast to Solidity's global variables, Soroban relies on passing an `<a href="https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Env.html"><span>Env</span></a>` argument to all functions which provides access to the environment the contract is executing within.

The `<span>Env</span>` provides access to information about the currently executing contract, who invoked it, contract data, functions for signing, hashing, etc.

For instance, you would use `<span>env.storage().persistent().get(key)</span>` to access a `<span>persistent</span>` target value from the contract's [storage](https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Env.html). Read more about the different storage types [here](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/persisting-data.md).

* `<span>env.storage()</span>` is used to get a struct for accessing and updating contract data that has been stored.
* Used as `<span>env.storage().persistent().get()</span>` or `<span>env.persistent().storage().set()</span>`.
* Additionally, we utilize the `<span>clone()</span>` method, a prevalent trait in Rust that allows for the explicit duplication of an object.

See the example below for implementations of `<span>env.storage()</span>` and `<span>clone()</span>`

* `<span>env.storage().persistent().set()</span>`

```
use soroban_sdk::{Env, Symbol};

    pub fn set_storage(env: Env) {
        let key = symbol_short!("key");
        let value = symbol_short!("value");
        env.storage().persistent().set(&key, &value);
}
```

* `<span>env.storage().persistent().get()</span>`

```
use soroban_sdk::{Env};

    pub fn get_storage(env: Env) -> value {
        env.storage().persistent().get(&key);
}
```

* `<span>clone()</span>`

```
use soroban_sdk::{Env, Address};

    pub fn return_user(user: Address) -> Address {
        let user_address: Address = user.clone();
        user_address
}
```

### Error Handling

The Soroban Rust SDK and Solidity provide a number of ways to handle errors. These include:

#### Solidity

Solidity provides a `<span>require</span>` function that can be used to check for certain conditions and revert the transaction if they are not met. For example, the following code sets a minimum value for the amount of Ether sent with the transaction:

```

function deposit() public payable {
    require(msg.value >= 1 ether, "Not enough Ether sent");
    // ...
}
```

#### Soroban

The [panic!](https://doc.rust-lang.org/book/ch09-00-error-handling.html) macro serves as Rust's error-handling mechanism, which closely resembles the `<span>require</span>` function in Solidity.

```
pub fn simple_deposit(amount: u32) {
    if amount < 1_000_000 {
        panic!("amount too low");
    }
        // ...
    }
```

### Address-Related Functionality

Both Soroban and Solidity provide provide a number of functions for working with addresses. These functions include:

#### Solidity

* `<span>address(this)</span>`: Returns the address of the current contract.
* `<span>address payable(this)</span>`: Returns the address of the current contract as a payable address.
* `<span>address(address)</span>`: Returns the address of the specified account.
* `<span>address payable(address)</span>`: Returns the address of the specified account as a payable address.

Below is an example of a smart contract that illustrates how contracts can be retrieved

```
pragma solidity ^0.8.0;

contract SimpleContract {
    address public contractAddress = address(this);
    address public randomAddress = 0x1234567890123456789012345678901234567890;

    address public payableAddress = payable(address(this));
    address public payableRandomAddress = payable(0x1234567890123456789012345678901234567890);
}
```

There would be no difference in appearance between a regular address and a payable address in Solidity.

#### Soroban

* `<span>e.current_contract_address()</span>`: Returns the Address object corresponding to the current executing contract.

The `<span>Env</span>` not only provides essential information about the currently executing contract and its invoker, but also offers access to contract data and functions for signing, hashing, and more. The construction or conversion of most types in Soroban requires access to an `<span>Env</span>` instance.

Here is an example of a smart contract that illustrates how contracts can be retrieved:

```
#![no_std]
use soroban_sdk::{contractimpl, log, Address, Env, Symbol};

#[contract]
pub struct SimpleContract;

#[contractimpl]
impl SimpleContract {
    ///Example contract for returning a contract Address.
    pub fn return_address(env: Env) -> Address {
        let current_contract_address = env.current_contract_address();
        current_contract_address
    }
}
```

#### Why Soroban Differs

Soroban has some differences from Solidity in terms of addresses and other functionalities. These differences arise due to the design principles and goals of Soroban.

One significant difference is the use of the `<span>Env</span>` object in Soroban. The `<span>Env</span>` object encapsulates various functionalities related to contract execution, data access, and more. It provides a unified interface for interacting with the Soroban environment within the context of a contract. By utilizing the `<span>Env</span>` object, Soroban enables a more modular and flexible approach to contract development.

To further explain, the `<span>Env</span>` type offers a gateway to the environment where the contract operates. It provides information about the ongoing contract, the entity invoking it, contract data, and functions for signing, hashing, and so forth. Most types demand access to an `<span>Env</span>` for their construction or conversion.

Meanwhile, the `<span>Address</span>` object serves as a potent tool for authentication and [authorization](#authorization). For instance, it can be used to authorize token transfers, acting as a security gatekeeper within the system. This feature amplifies the functionality of addresses in Soroban, making them not just a means of identification or storage, but also a key player in verifying and authorizing transactions.

### Function Visibility Specifiers

The Soroban Rust SDK and Solidity provide a number of function visibility specifiers that can be used to control who can call a function. These specifiers include:

#### Solidity

* `<span>public</span>`: Anyone can call the function.
* `<span>external</span>`: Only other contracts can call the function.
* `<span>internal</span>`: Only the current contract and contracts that inherit from it can call the function.
* `<span>private</span>`: Only the current contract can call the function.

Here is an example of a smart contract that illustrates how function visibility is used in Solidity:

```
pragma solidity ^0.8.0;

contract SimpleContract {
    function publicFunction() public {}
    function externalFunction() external {}
    function internalFunction() internal {}
    function privateFunction() private {}
}
```

#### Soroban

* `<span>pub</span>`: The item (function, struct, etc.) is accessible from any module or scope.
* `<span>pub(crate)</span>`: The item is accessible only within the current crate.
* `<span>pub(super)</span>`: The item is accessible only within its parent module.
* `<span>pub(in path::to::module)</span>`: The item is accessible only within the specified module path.
* `<span>private</span>`: The item is not marked as pub and is therefore private to its own module, meaning it can only be accessed within the same module and is not accessible from outside the module.

Here is an example of a module that illustrates how function visibility is used in Soroban:

```
#![no_std]
use soroban_sdk::{contractimpl, Env};

mod outer {
    pub struct PublicStruct {
        pub field: u32,
    }

    pub(crate) struct CrateStruct {
        pub(crate) field: u32,
    }

    // This struct is private because it is not marked as `pub`.
    struct PrivateStruct {
        field: u32,
    }

    mod inner {
        pub(super) struct SuperStruct {
            pub(super) field: u32,
        }
    }

    pub fn get_all_fields() -> u32 {
        let public_struct = PublicStruct { field: 1 };
        let crate_struct = CrateStruct { field: 2 };
        let private_struct = PrivateStruct { field: 3 };
        let super_struct = inner::SuperStruct { field: 4 };
        public_struct.field + crate_struct.field + private_struct.field + super_struct.field
    }
}

#[contract]
pub struct NewContract;
 trait OuterTrait {
    fn get_all_fields() -> u32;
    fn get_public_fields() -> u32;
}

#[contractimpl]
impl OuterTrait for NewContract {
    fn get_public_fields() -> u32 {
        let public_struct = outer::PublicStruct { field: 1 };
        let crate_struct = outer::CrateStruct { field: 2 };
        // private structs cannot be accessed from outside the crate
        public_struct.field + crate_struct.field
    }

    fn get_all_fields() -> u32 {
        outer::get_all_fields()
    }
}
```

### Time-Based Variables

The Soroban Rust SDK and Solidity provide a number of time-based variables that can be used to access information about the current block(EVM) or ledger(Soroban). These variables include:

#### Solidity

* `<span>block.timestamp</span>`: The timestamp of the current block.
* `<span>block.number</span>`: The number of the current block.

Here is an example of a smart contract that illustrates how time-based variables are used in Solidity:

```
pragma solidity ^0.8.0;

contract SimpleContract {
    function getTimestamp() public view returns (uint256) {
        return block.timestamp;
    }

    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }
}
```

#### Soroban

* `<span>env.ledger().timestamp()</span>`: Returns a unix timestamp for when the most recent ledger was closed.
* `<span>env.ledger().sequence()</span>`: Returns the sequence number of the most recently closed ledger.

Here is an example of a smart contract that illustrates how time-based variables are used in Rust:

```
#![no_std]
use soroban_sdk::{contractimpl, Address, Env};

#[contract]
pub struct SimpleContract;

#[contractimpl]
impl SimpleContract {
    pub fn get_timestamp(env: Env) {
        let timestamp = env.ledger().timestamp();
        let sequence = env.ledger().sequence();
    }
}
```

### Authorization

Soroban differs from Solidity in its approach to authorization and modifiers. While Solidity has a built-in modifier system, Sorotban does not. Instead, Soroban leverages traits, their implementations, and core features to achieve similar functionality.

#### Solidity

In Solidity, the ERC20 token standard includes the `<span>approve</span>` function, which allows a token holder to authorize another address to spend a certain amount of tokens on their behalf. This function is commonly used in decentralized exchanges and other token transfer scenarios. Furthermore, we're ensuring that the spender is authorized to spend the amount of tokens requested by the token holder.

Here's an example of how the approve function acts as an authorization mechanism in Solidity:

```
pragma solidity ^0.8.0;

contract ERC20Token {

    constructor() {
        address owner = msg.sender;
        ownerAddress = owner;
    }

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    mapping(address => bool) public isAuthorized;

    address public ownerAddress;

    function approve(address spender, uint256 amount) public returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function setAuthorization(address newAuth) public returns (bool) {
        require(msg.sender == ownerAddress);
        isAuthorized[newAuth] = true;
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(allowances[msg.sender][to] >= amount, "Not enough allowance");
        require(isAuthorized[to] == true, "Not authorized");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
}
```

The approve function allows the token holder to authorize spender to spend amount tokens on their behalf. The transfer function then checks if the spender is authorized to spend the amount of tokens requested by the token holder. If so, the transfer is executed.

These Solidity examples illustrate some common authorization patterns used in Ethereum smart contracts. Soroban provides alternative approaches to achieve similar functionality, leveraging core functionality derived right from the soroban SDK.

#### Soroban

Soroban's design principles prioritize flexibility, security, and testability, which have led to differences in how authorization is handled compared to Solidity.

Soroban provides built-in functions such as `<span>require_auth</span>` and `<span>require_auth_for_args</span>` through the `<span>Address</span>` struct. These functions help enforce authorization rules within contracts. During on-chain execution, the Soroban host performs the necessary authentication, including verifying signatures and  **ensuring replay prevention** . This alleviates the burden of authentication from the contracts themselves, promoting security and reducing potential vulnerabilities.

Here is an example of a smart contract that illustrates how authorization is handled in Soroban:

```
#![no_std]
use soroban_sdk::{contractimpl, testutils::Address as _, Address, Symbol, Env, IntoVal};

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn transfer(env: Env, address: Address, amount: i128) {
        address.require_auth();
    }
    pub fn transfer2(env: Env, address: Address, amount: i128) {
        address.require_auth_for_args((amount / 2,).into_val(&env));
    }
}
```

In this example, we have a Soroban contract that includes two public functions: `<span>transfer</span>` and `<span>transfer2</span>`, both of which involve authorization checks.

Inside the Transfer function, the `<span>require_auth</span>` method is invoked on the address object. This method ensures that the caller of the contract has the necessary authorization to execute the transfer.

The `<span>transfer2</span>` function follows a similar pattern but uses the `<span>require_auth_for_args</span>` method instead. It takes the same parameters as transfer but provides a tuple (amount / 2,) as the argument to `<span>require_auth_for_args</span>`. This method verifies that the caller has authorized the contract invocation with the specific arguments.

By utilizing these authorization methods provided by the `<span>Address</span>` object from the Soroban Rust SDK, the contract enforces that only authorized callers can perform the transfers. This approach enhances the security of the contract by ensuring that sensitive operations can only be executed by authorized parties.

Soroban's approach to authorization in this example offers several advantages over Solidity's model of ERC20 by eliminating the need for separate approval management. Instead, authorization checks can be directly incorporated into any Soroban function. This simplifies the contract codebase and reduces the complexity associated with managing separate approval states.

Soroban authorization provides Contract-level Authorization, Account Abstraction Functionality, and more advanced Authorization checks. To learn more about these advantages, visit the [Authorization section](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization.md) of the documentation.

## Summary

Overall the Soroban equivalents of Solidity concepts are very similar. However, there are notable differences worth highlighting. Soroban uses `<span>env</span>` instead of `<span>msg</span>` to access information about the entire contract execution environment, including the state of the contract, addresses involved, and more. Authorization is also handled differently in Soroban, as it is built into the core functionality of the SDK and is more robust than relying on smart contract code alone.

For more information on Solidity concepts and their Soroban equivalents, it is recommended that one refer to both the [Soroban Rust SDK documentation](https://docs.rs/soroban-sdk/latest/soroban_sdk/struct.Env.html) and the [Solidity documentation](https://docs.soliditylang.org/en/v0.8.19/cheatsheet.html).
