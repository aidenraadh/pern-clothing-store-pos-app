import React from 'react'
import SVGIcons from './SVGIcons.js'


export function Button(props){
	const BtnTag = props.tag
	const icon = props.iconName ? <SVGIcons name={props.iconName}/> : ''
	const attr = {...props.attr}
	const classes = `btn btn-${props.size} btn-${props.type} ${props.color}` +
		(props.iconName && props.iconOnly ? ' icon-only' : (icon ? ' with-icon' : '')) +
		(props.classes ? ' '+props.classes : props.classes)

	if(BtnTag === 'button' && !attr.type){
		attr.type = 'button'
	}
	return (
		<BtnTag className={classes} {...attr}>
			{icon}
			<span className="btn-text">{props.text}</span>
		</BtnTag>
	)
}

Button.defaultProps = {
	tag: 'button', text: 'Button',
	size: 'md', // 'lg'|'md'|'sm'
	type: 'primary', // 'prmiary'|'light'
	color: 'blue', // 'red'|'blue'|'orange'|'green'|'purple'|'black'
	iconName: '', // String
	iconOnly: false, // Boolean
	attr: {},
	classes: '',
}

export function FloatingButton(props){
	const BtnTag = props.tag;
	const classes = props.classes ? ' '+props.classes : props.classes
	return (
		<BtnTag className={'floating-btn flex-row items-center content-center text-white'+classes}
		{...props.attr}>
			{props.text}
		</BtnTag>
	);
}

FloatingButton.defaultProps = {
	tag: 'button', text: 'Button', classes: '',
	attr: {}
}

export function ButtonGroup(props){
	const Tag = props.tag
	const classes = 'btn-group' + (props.classes ? ' '+props.classes : props.classes)

	return (
		<Tag className={classes} {...props.attr}>
			{props.buttons}
		</Tag>
	);
}

ButtonGroup.defaultProps = {
	tag: 'div', classes: '', attr: {},
	buttons: (<>
		<Button/>
		<Button/>
	</>) // JSX
}