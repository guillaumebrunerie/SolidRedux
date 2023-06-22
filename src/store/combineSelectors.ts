import type { AppState } from "./store";
import { shallowEqual } from "react-redux";

/*
Small library to create localized/parameterized/memoized/curried selectors,
inspired by Reselect but using curried selectors instead.

A *parameterized selector* is a pure function

    selectStuff: (props: Arguments) => (state: State) => Result

It can be used directly with `useSelector` as follows:

    const stuff = useSelector(selectStuff(props));

If a parameterized selector is called several times in a row with the same
arguments, it should return a referentially equal result.

The main function of this library is `combineSelectors`, which, given several
selectors

    selectStuff1: (props: Arguments1) => (state: State) => Result1
    selectStuff2: (props: Arguments2) => (state: State) => Result2
    selectStuff3: (props: Arguments3) => (state: State) => Result3

and a combining function

    combiner: (value1: Result1, value2: Result2, value3: Result3) => Result

gives a resulting selector

    combineSelectors([selectStuff1, selectStuff2, selectStuff3], combiner)
        : (props: Arguments1 & Arguments2 & Arguments3) => (state: State) => Result

which basically does

    props => state => combiner(selectStuff1(props)(state), selectStuff2(props)(state), selectStuff3(props)(state))

By default that is all it does, but there are several options that can be used
for caching results.

Passing `{cached: true}` as a third argument to `combineSelectors` will cache
the result of the combining function and run it again only if one of the input
selectors returns a referentially different value.

Passing `{shallowEquality: true}` will compare the result with the previous one
using shallow equality and return the previous one if they are shallow equal. It
also implies `{cached: true}`.

Similarly, `{deepEquality: true}` will compare the result using deep equality
(JSON.stringify) and it also implies `{cached: true}`.
*/

type ParameterizedSelector<S = never, A = never, R = unknown> =
	(props: A) => (state: S) => R;

type Combiner<InputSelectors extends ReadonlyArray<ParameterizedSelector>, R> =
	(...args: CombinerArguments<InputSelectors>) => R;

type Options = {
	cached?: boolean,
	shallowEquality?: boolean,
	deepEquality?: boolean,
};

const deepEqual = (v1: unknown, v2: unknown) => {
	try {
		return JSON.stringify(v1) === JSON.stringify(v2);
	} catch (e) {
		return false;
	}
};

const checkEqual = (v1: unknown, v2: unknown, options: Options) => (
	v1 === v2 || (options.shallowEquality && shallowEqual(v1, v2)) || (options.deepEquality && deepEqual(v1, v2))
);

// Apply the given input selectors to the given props and state, and return
// a result with a type that can be fed to the combining function.
const applyInputSelectors = <InputSelectors extends ReadonlyArray<ParameterizedSelector>>(
	inputSelectors: InputSelectors,
	props: ResultArguments<InputSelectors>,
	state: AppState,
): CombinerArguments<InputSelectors> => {
	//@ts-ignore This is way too complex to typecheck properly
	return inputSelectors.map(selector => selector(props)(state));
}

// The main `combineSelectors` function
export const combineSelectors = <InputSelectors extends ReadonlyArray<ParameterizedSelector>, R>(
	inputSelectors: InputSelectors,
	combiner: Combiner<InputSelectors, R>,
	options: Options = {},
): (props: ResultArguments<InputSelectors>) => (state: AppState) => R => {
	const cached = options.cached || options.shallowEquality || options.deepEquality;

	// Optimization for non-cached selectors
	if (!cached) {
		return (props) => {
			return (state) => {
				const dependencies = applyInputSelectors(inputSelectors, props, state);
				const result = combiner(...dependencies);
				return result;
			};
		};
	}

	// General case

	// Cache for the selectors themselves, this is necessary as the selectors
	// are closures remembering the previous result/dependencies, so they need
	// to be cached. The key is `JSON.stringify` of the arguments, which are
	// assumed to be serializable (typically it's an object with strings and
	// numbers, so it works).
	const selectorCache = new Map<string, (state: AppState) => R>();

	return (props) => {
		// Check if we already have a cached instance of this selector
		const key = JSON.stringify(props);
		if (selectorCache.has(key)) {
			return selectorCache.get(key) as (state: AppState) => R;
		}

		// Otherwise we need to create it

		// Variables stored in the closure
		let dependencies: CombinerArguments<InputSelectors>;
		let result: R;
		// The selector itself
		const selector = (state: AppState): R => {
			const newDependencies = applyInputSelectors(inputSelectors, props, state);

			// Caching à la Reselect
			if (shallowEqual(newDependencies, dependencies)) {
				return result;
			}

			// Otherwise, we need to run the combining function
			dependencies = newDependencies;
			const newResult = combiner(...dependencies);

			// Result equality check, to avoid returning new references
			if (checkEqual(result, newResult, options)) {
				return result;
			}

			// Otherwise we return the new result
			result = newResult;
			return result;
		}
		// Store the newly created selector in the cache and return it
		selectorCache.set(key, selector);
		return selector;
	}
};

// The `selectArgument` function, used to add arguments to a selector
//
// Usage:
// `selectArgument("myArgumentName")<MyType>` is a parameterized selector that
// selects `props.myArgumentName` and assumes it is of type `MyType` (which
// should be a serializable type). It is used as an input selector in a
// `combineSelectors` call.
type Serializable = string | number | boolean | undefined | null; // Could be extended if needed
export const selectArgument = <K extends string>(key: K) =>
	<T extends Serializable>(props: Record<K, T>) => () => props[key];

// The `selectRoot` function, that simply selects the whole state. Not really
// necessary but allows you to build every single selector out of the three
// functions `combineSelectors`, `selectArgument` and `selectRoot`.
export const selectRoot = () => (state: AppState) => state;


/* Typescript stuff */

// Compute the arguments and return type of parameterized selectors
type SelectorArguments<D> = D extends (props: infer A) => (state: never) => unknown ? A : never;
type SelectorReturnType<D> = D extends (props: never) => (state: never) => infer R ? R : never;

// Compute the intersection Arguments1 & ... & ArgumentsN, given input
// selectors, making sure the intersection is fully reduced, to get selectors
// with readable types.

type Reduce<T> = T extends unknown ? {
    [P in keyof T]: T[P]
} : never;

type ResultArguments<InputSelectors extends ReadonlyArray<ParameterizedSelector>> =
	InputSelectors extends readonly []
	? unknown
	: InputSelectors extends readonly [
		...infer A extends ReadonlyArray<ParameterizedSelector>,
		infer B extends ParameterizedSelector,
	] ? Reduce<ResultArguments<A> & SelectorArguments<B>>
		: never;

// Compute the array type [Result1, ..., ResultN] (which is used in the type of
// the combining function), given input selectors.
type CombinerArguments<InputSelectors extends ReadonlyArray<ParameterizedSelector>> =
	InputSelectors extends readonly []
	? []
	: InputSelectors extends readonly [
		...infer A extends ReadonlyArray<ParameterizedSelector>,
		infer B extends ParameterizedSelector,
	] ? [...CombinerArguments<A>, SelectorReturnType<B>]
		: never;
