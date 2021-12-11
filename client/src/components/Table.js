import React from 'react';

export default function Table(props){
	const container_classes = (props.container_classes ? ' '+props.container_classes : '');
	const ribboned = (props.ribboned ? ' ribboned' : '');
	const ribbon_colors = ['blue', 'green', 'red', 'purple', 'orange'];
	let current_ribbon = -1;

  	return (
  		<div className={'table-container'+container_classes} {...props.container_attr}>
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

/*
Example:

<Table
	headings={['asd', 'qwe', 'zxc']}
	body={[
		['data1', 'data2', 'data3'],
		['data1', 'data2', 'data3'],
		['data1', 'data2', 'data3']
	]}
	container_classes={'some classes'} // optional
	container_attr={{}} // optional
	ribboned={true|false} // optional
/>	
*/
