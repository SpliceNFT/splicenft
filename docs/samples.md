# that's a page to test advanced MkDocs / Material tools

checkout the [official docs](https://squidfunk.github.io/mkdocs-material/reference/abbreviations/):  I didn't activate all of it here, yet.


## testing some features

fenced code blocks

```javascript title="JS is too easy" hl_lines="2"
function foo() { 
  return "boo"; 
}
```

```python title="never_learnt_python.py" linenums="1" 
def some_func(word):
  print("python is a language.")
  if (q == "yep"):
    print("whitespace does matter")

some_func("foo")
```

but can also do `inline code`, does it?

~~~
make: tilde fence marks are also valid
~~~

!!! note "Heads up"
  
    This is content for an Admoniton.


## Lets check tab grouped  content

=== "Solidity"

    ```solidity
    // contracts/GLDToken.sol
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    import '@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol';

    contract GLDToken is ERC20PresetMinterPauser {
      constructor(uint256 initialSupply) ERC20PresetMinterPauser('Gold', 'GLD') {
        _mint(msg.sender, initialSupply);
      }
    }
    ```

=== "Typescript"

    ```typescript
    const q: Record<string, number> = {
      "foo": 1,
      "moo": 2
    }

    enum State { POTATO, TOMATO, PEANUT }

    class Mouse {
      private state: State;
      constructor(state = POTATO);
    }
    ```

## But what about tables?

| Method      | Description                          |
| ----------- | ------------------------------------ |
| `GET`       | :material-check:     Fetch resource  |
| `PUT`       | :material-check-all: Update resource |
| `DELETE`    | :material-close:     Delete resource |