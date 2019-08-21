import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import './type_style.css';

//  ----------------------------------------------------------------------------------------
// # Constants
//  ----------------------------------------------------------------------------------------

// String used to construct links to the reference
const ReferenceLink = (
  window.location.href.split('/?page=')[0].replace('http://', '') +
  '/?page=printType:NAME'
).replace('//?page', '/?page');

//  ----------------------------------------------------------------------------------------
// # Functions
//  ----------------------------------------------------------------------------------------

// makeType(String, [type]) ==> <ReactMarkdown />
// takes the name of a type (Scalar, 0bject, Input-Object, Interface, Union or Enum) and an array of types
// represenging all types in the schema (to be used to make links) and prints the named type using react-markdown
function makeType(typeName, printHeader, printDiscriptions, types) {
  const filtered = types
    .map(type => {
      let printedType = '';
      if (type.kind === 'ENUM' && type.name === typeName) {
        printedType =
          `  \n  **${type.name}**: *${type.description}*  \n  `.replace(
            ': *null*',
            '',
          ) +
          `  \n  | | | \n |-|-| \n | \`enum ${type.name} {\` | ${stringifyValues(type.enumValues, printDiscriptions)}`;
      }
      if (type.kind === 'OBJECT' && type.name === typeName) {
        printedType =
          `  \n  **${type.name}**: *${
            type.description
          }*  \n  \`\`  \n  `.replace(': *null*', '') +
          stringifyFields(
            type.fields, 
            types, 
            type.name,
            'type',
            printDiscriptions);
      }
      if (type.kind === 'INPUT_OBJECT' && type.name === typeName) {
        printedType =
          `  \n  **${type.name}**: *${
            type.description
          }*  \n  \`\`  \n  `.replace(': *null*', '') +
          stringifyFields(
            type.inputFields,
            types,
            type.name,
            'type',
            printDiscriptions,
          );
      }
      if (type.kind === 'INTERFACE' && type.name === typeName) {
        printedType =
          `  \n  **${type.name}**: *${
            type.description
          }*  \n  \`\`  \n  `.replace(': *null*', '') +
          stringifyFields(
            type.fields, 
            types, 
            type.name,
            'interface', 
            printDiscriptions);
      }
      if (type.kind === 'UNION' && type.name === typeName) {
        printedType =
          `  \n  **${type.name}**: *${type.description}*  \n  `.replace(
            ': *null*',
            '',
          ) +
          `  \n  \'union ${type.name}:\` ` +
          type.possibleTypes
            .map(pType => {
              return `\`${pType.name}\``;
            })
            .join(' | ') +
          '  \n  ';
      }
      if (type.kind === 'SCALAR' && type.name === typeName) {
        printedType = `  \n  **${type.name}**  \n  \`${type.name}\`: ${
          type.description
        }  \n  `;
      }
      if (!printHeader) {
        printedType = printedType
          .replace(`**${type.name}**: *${type.description}*`, '')
          .replace(`**${type.name}**`, '');
      }
      return printedType;
    })
    .sort()
    .join('');
  return (
    <ReactMarkdown
      source={filtered}
      renderers={{
        link: props => (
          <a href={props.href} target='_blank'>
            {props.children}
          </a>
        ),
        table: props => <table id='typeTable'>{props.children}</table>,
      }}
    />
  );
}

// stringifyValues(value, Boolean) ==> String
// takes an array of enumValues and a boolean that is true iff descriptions should be printed
// and returns it as a string to be parsed into markdown.
function stringifyValues(enumValues, printDiscriptions) {
  if (printDiscriptions) {
    return '| | \n  ' + enumValues.map(value => {
      return `| &nbsp &nbsp  \`${value.name}\` | ${value.description} |  \n  `;
    })
    .join('') + '| } | |';
  } else {
    return '| \n  ' + enumValues.map(value => {
      return `| &nbsp &nbsp  \`${value.name}\` | |  \n  `;
    })
    .join('') + '| } | |  \n  | | | \n';
  }
}

// stringifyFields([field], [type], String, String Boolean) ==> String
// takes an array of Fields or inputFields, an array of types represenging all types in the schema (to be used to
// make links), the name of the type to which the Fields belong, the type of that type, and a boolean which is true iff
// the field descriptions are to be printed, and returns the fields as a string to be rendered in markdown.
function stringifyFields(fields, types, parentName, parentOfType, printDiscriptions) {
  if (printDiscriptions) {
    return (
      `  \n  | **\`${parentOfType}\`** ${stringifyType(parentName, types,)} \`{\` | |  \n  |-|-|  \n  ` +
      fields.map(type => {
          return (
            `  | &nbsp; &nbsp; \`${type.name}:\` ${stringifyType(getType(type), types)} | ` + 
            `${String(type.description).replace('null', '')} |  \n`
            );
        })
        .sort()
        .join('') +
      ' | ```}``` | |  \n  ');
  } else {
    return (
      `  \n  | **\`${parentOfType}\`** ${stringifyType(parentName, types,)} \`{\` |  \n  |-|  \n  ` +
      fields.map(type => {
          return (
            `  | &nbsp; &nbsp; \`${type.name}:\` ${stringifyType(getType(type), types)} |  \n`
            );
        })
        .sort()
        .join('') +
      ' | ```}``` |  \n  ');
  }
}

// stringifyType(String, [type]) ==> String
// Takes the name of a type and an array of all types and returns the type as a string (builds links)
function stringifyType(typeName, types) {
  const matchedType = types.filter(aType => aType.name === typeName);
  const tString = ` \`${typeName}\``;
  if (matchedType.length === 1) {
    return `[${tString}](http://${ReferenceLink})`.replace(
      'NAME',
      matchedType[0].name,
    );
  } else {
    return tString;
  }
}

// printType(type) ==> String
/// takes some kind of type and prints that type's name
function getType(t) {
  let s = '';
  try {
    s = s + t.type.name;
  } catch {}
  try {
    s = s + t.type.ofType.name;
  } catch {}
  try {
    s = s + t.typeOf.name;
  } catch {}
  try {
    s = s + t.typeOf.ofType.name;
  } catch {}
  try {
    s = s + t.typeOf.typeOf.name;
  } catch {}
  try {
    s = s + t.typeOf.typeOf.ofType.name;
  } catch {}
  return s.replace('null', '');
}

//  ----------------------------------------------------------------------------------------
// # Component
//  ----------------------------------------------------------------------------------------

// Component Class
export default class TypeComponent extends Component {
  // Constructor
  constructor(props) {
    super(props);
  }

  // Render
  render() {
    return makeType(
      this.props.typeName,
      this.props.printHeader,
      this.props.printDiscriptions,
      this.props.types
    );
  }
}