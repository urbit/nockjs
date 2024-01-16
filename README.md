# nockjs

A Javascript implementation of [Nock](https://developers.urbit.org/reference/nock).

## Install

```
npm install @urbit/nockjs
```

## Usage

Presently, primarily for dealing with nouns as Javascript objects.

- A `Noun` is an `Atom` or a `Cell`.
- `Atom.fromString('123', 10)`, `Atom.fromInt(123)`, `Atom.fromCord('{')` all create a new `Atom` object. Uses `bigint` internally, can construct with `new Atom(someBigint)`.
- `new Cell(a, b)`.
- `dwim(...)` does a best-effort attempt of interpreting the arguments into a `Noun`.
- `enjs` contains `Noun => Json` conversions and conversion builders.
- `dejs`contains `Json => Noun` conversions for idiomatic noun shapes.

### Immutability

When working with Noun objects, it is important to treat them as immutable,
and not assign to their properties or otherwise modify them directly. The
TypeScript `readonly` property should prevent you from doing so, and you
must not ignore this.

This library implements unifying equality, deduplicating identical nouns in
memory whenever they are detected. This means that one `Noun` object might be
a sub-noun to many other `Noun`s, and changing the one sub-noun could change it
for all nouns it is used in. Additionally, the `Noun` object keeps a mug cache,
which does not get cleared when illicitly changing the noun's contents.
