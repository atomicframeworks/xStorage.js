# xStorage.js
Cross-domain localStorage asynchronously<br>

## About
xStorage.js provides an easy interface for cross-domain localStorage utilizing asynchronous Promises.  When the script is loaded it creates a hidden iFrame with the proxy 

## Installation
1. Include the xStorage.js file on the page where you wish to acess cross-domain localStorage. No other requirements to start using xStorage.js! If you do not feel like hosting your own storage proxy simply use the standard settings. <br>
```html
<script src="xStorage.js"></script>
```
This script will create the xStorage object which has methods to access the cross-domain localStorage.


# Usage
You can get, set, merge, or delete properties using the associated function on the xStorage object.<br>

## Set
Set a property on the cross-domain localStorage object.<br><br>
Syntax - `xStore.set(property[, value])`<br>
Returns - A Promise or deferred object that allows you to chain .then() function calls.<br>
Resolves - The cross-domain localStorage object.<br><br>

Passing a value will set the cross-domain localStorage property to that value.<br>
Passing null or undefined as the value will erase the property from cross-domain localStorage.<br>

##### Example
```js
xStorage.set('hello', 'world').then(function(data) {
	console.dir(data);
});
```

<br>
## Get
Get all properties, a single property, an array of properties, or an object containing properties & values from cross-domain localStorage.<br><br>
Syntax - `xStore.get(properties)` <br>
Returns - A Promise or deferred object that allows you to chain .then() function calls.<br>
Resolves - <br>
&nbsp;&nbsp;&nbsp;&nbsp;If you pass undefined, or null you will get an object containing all properties and values.<br>
&nbsp;&nbsp;&nbsp;&nbsp;If you pass a single property you will recieve it's value back.<br>
&nbsp;&nbsp;&nbsp;&nbsp;If you pass an array of properties you will receive an array with the values for each property.<br>
&nbsp;&nbsp;&nbsp;&nbsp;If you pass an object you will receive an object containing the properties and values.<br>

Passing a value will set the cross-domain localStorage property to that value.<br>
Passing null or undefined as the value will erase the property from cross-domain localStorage.<br>

##### Example
```js
xStorage.get('hello').then(function(data) {
	console.log(data);
});
```

<br>
## Merge
Merge an object with cross-domain localStorage.<br><br>
Syntax - `xStore.merge(object)`<br>
Returns - A Promise or deferred object that allows you to chain .then() function calls.<br>
Resolves - An object containing all properties and values.<br>

Passing an object will merge all properties and values with the cross-domain localStorage object.  If a property value is set to null or undefined in the object to merge they will be erased from the cross-domain localStorage.

##### Example
```js
xStorage.merge({foo: 'bar'}).then(function(data) {
	console.log(data);
});
```

<br>
## Delete
Delete a single property or all properties from cross-domain localStorage.<br><br>
Syntax - `xStore.delete(property)`<br>
Returns - A Promise or deferred object that allows you to chain .then() function calls.<br>
Resolves - An object containing all properties and values.<br>

Passing a string or number for the property will delete that specific property from the cross-domain localStorage object.<br>
Passing undefined or null will delete all properties from the cross-domain localStorage object.

##### Example
```js
	xStorage.delete('foo').then(function(data) {
		console.log(data);
	});
```

## License 
xStorage.js is released under the MIT license<br>
[www.opensource.org/licenses/MIT](www.opensource.org/licenses/MIT)