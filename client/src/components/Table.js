import React from 'react';

export default function Table(props){
	const ribboned = props.ribboned
	const ribbon_colors = ['blue', 'green', 'red', 'purple', 'orange'];
	let current_ribbon = -1;
	const classes = 'table-container' + (props.classes ? ' '+props.classes : '')

  	return (
  		<div className={classes} {...props.attr}>
  			<table>
  				<thead>
  					<tr>
  	  	    		{props.headings.map((heading, key) => (
  	  	    			<th key={key}>{heading}</th>
  	  	    		))}
  	  	    		</tr>
  	  	  		</thead>
  	  	  		<tbody>
  	  	  		{props.body.map((row, rowkey) => {
					++current_ribbon;
					if(current_ribbon + 1 > 5){
						current_ribbon = 0;
					}
					return (
  	  	    		<tr key={rowkey} className={(ribboned ? ribboned+' '+ribbon_colors[current_ribbon] : '')}>
  	  	    		{row.map((col, colkey) => (
  	  	    			<td key={colkey}>{col}</td>
  	  	    		))}
  	  	    		</tr>
					)
				})}
  	  	  		</tbody>
  	  		</table>  	
  		</div>
  	);
}

Table.defaultProps = {
	classes: '', attr: {}, 
	ribboned: false, // Boolean
	headings: ['Heading 1', 'Heading 2'], // Array of string or JSX
	body: [
		['Data 1', 'Data2'] // Array of string or JSX
	],
}
