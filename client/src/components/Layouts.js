import React from 'react';

export function Grid(props){
	const GridTag = props.tag
	const classes = props.classes ? ' '+props.classes : props.classes
	const num_of_columns = parseInt(props.num_of_columns);
	let collapsed_on;
	switch(props.collapsed_on){
		case 'mobile': collapsed_on = ' collapsed-on-mobile'; break;
		case 'tablet': collapsed_on = ' collapsed-on-tablet'; break;
		default: collapsed_on = '';
	}
	
	return (
		<GridTag className={'grid grid-'+num_of_columns+collapsed_on+classes} {...props.attr}>
			{props.items.map((item, key) => (
				<div className="grid-item" key={key}>
					{item}
				</div>
			))}		
		</GridTag>
	)
}

Grid.defaultProps = {
	tag: 'div', classes: '', attr: {},
	num_of_columns: '3', // Integer
	collapsed_on: 'mobile', // 'mobile' or 'tablet'
	items: ['Text 1', 'Text 2', 'Text 3'] // Array of string or JSX
}

export function SectionHeader(props){
	const container_classes = props.container_classes ? ' '+props.container_classes : ''
	const HeaderTag = props.header_tag
	const HeadingTag = props.heading_tag

	return (
		<HeaderTag className={'section-header flex-row content-space-between items-center'+container_classes}
		{...props.container_attr}>
			<HeadingTag className="heading flex-row items-center text-semi-bold text-dark-2">{props.heading}</HeadingTag>

			{props.header_actions ? 
			<section className="header-actions flex-row items-center">
				{props.header_actions}
			</section> : ''
			}
		</HeaderTag>
	);
}

SectionHeader.defaultProps = {
	container_classes: '', header_tag: 'div', heading_tag: 'h6',
	heading: 'Heading', 
	header_actions: 'Some actions here...', // String or JSX
	container_attr: {},
}