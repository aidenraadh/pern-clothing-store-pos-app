import React from 'react';

export function Grid(props){
	const GridTag = props.tag
	
	let collapsedOn

	switch(props.collapsedOn){
		case 'mobile': collapsedOn = ' collapsed-on-mobile'; break;
		case 'tablet': collapsedOn = ' collapsed-on-tablet'; break;
		default: collapsedOn = '';
	}
	const classes = `grid grid-${parseInt(props.numOfColumns)} ${collapsedOn}`+
		(props.classes ? ' '+props.classes : '')
	
	return (
		<GridTag className={classes} {...props.attr}>
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
	numOfColumns: '3', // Integer
	collapsedOn: 'mobile', // 'mobile' or 'tablet'
	items: ['Text 1', 'Text 2', 'Text 3'] // Array of string or JSX
}

export function SectionHeader(props){
	const HeaderTag = props.headerTag
	const HeadingTag = props.headingTag
	const classes = 'section-header flex-row content-space-between items-center' +
		(props.container_classes ? ' '+props.container_classes : '')

	return (
		<HeaderTag className={classes} {...props.attr}>
			<HeadingTag className="heading flex-row items-center text-semi-bold text-dark-2">{props.heading}</HeadingTag>

			{props.headerActions ? 
			<section className="header-actions flex-row items-center">
				{props.headerActions}
			</section> : ''
			}
		</HeaderTag>
	);
}

SectionHeader.defaultProps = {
	classes: '', headerTag: 'div', headingTag: 'h6',
	heading: 'Heading', 
	headerActions: 'Some actions here...', // String or JSX
	attr: {},
}