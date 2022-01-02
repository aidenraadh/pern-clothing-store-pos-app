import React from 'react'
import {SVGIcons} from './Misc.js'


export function Button(props){
	const BtnTag = props.tag
	const icon = props.iconName ? <SVGIcons name={props.iconName}/> : ''
	const iconStatus = props.iconName && props.iconOnly ? ' icon-only' : (icon ? ' with-icon' : '')
	const classes = props.classes ? ' '+props.classes : props.classes
	const attr = {...props.attr}

	if(BtnTag === 'button' && !attr.type){
		attr.type = 'button'
	}
	return (
		<BtnTag className={
			'btn btn-'+props.size+' btn-'+props.type+' '+
			props.color+iconStatus+classes
		} {...attr}>
			{icon}
			<span className="btn-text">{props.text}</span>
		</BtnTag>
	)
}

Button.defaultProps = {
	tag: 'button', text: 'Button',
	size: 'lg', // 'lg'|'md'|'sm'
	type: 'primary', // 'prmiary'|'light'
	color: 'blue', // 'red'|'blue'|'yellow'|'green'|'purple'
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
	const classes = props.classes ? ' '+props.classes : props.classes

	return (
		<Tag className={'btn-group'+classes} {...props.attr}>
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