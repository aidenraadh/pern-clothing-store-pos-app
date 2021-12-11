import React from 'react';

export function Grid(props){
	const GridTag = (props.tag ? props.tag : 'div');
	const classes = props.classes ? ' '+props.classes : '';
	const num_of_columns = parseInt(props.num_of_columns);
	let collapsed_on;
	switch(props.collapsed_on){
		case 'mobile': collapsed_on = ' collapsed-on-mobile'; break;
		case 'tablet': collapsed_on = ' collapsed-on-tablet'; break;
		default: collapsed_on = '';
	}
	
	return (
		<GridTag className={'grid grid-'+props.num_of_columns+collapsed_on+classes} {...props.attr}>
			{props.items.map((item, key) => (
				<div className="grid-item" key={key}>
					{item}
				</div>
			))}		
		</GridTag>
	) //;
}

/*
Example:

<Grid
	num_of_columns={'3'} // max columns = 3
	items={[
		'Items', 'Items',
	]}
	tag={} // optional
	attr={{}} // optional
	classes={'someclasses'} // optional
/>	
*/

export function SectionHeader(props){
	const container_classes = (props.container_classes ? ' '+props.container_classes : '');
	const HeaderTag = (props.header_tag ? props.header_tag : 'div');
	const HeadingTag = (props.heading_tag ? props.heading_tag : 'h6');

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

/*
Example:
<SectionHeader
	heading={'Hotel '+user_type}
	header_actions={'Some actions here...'} // optional
	header_tag={'header'} // optional
	heading_tag={'h2'} // optional
	container_classes={'some classes here'} // optional
	container_attr={{}} // optional
/>
*/