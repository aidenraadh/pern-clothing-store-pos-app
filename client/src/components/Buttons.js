import React from 'react'
import PropTypes from 'prop-types'
import {SVGIcons} from './Misc.js'


export function Buttons(props){
	const BtnTag = props.tag
	const icon = props.icon.name ? <SVGIcons name={props.icon.name}/> : ''
	const iconStatus = props.icon.iconOnly ? ' icon-only' : (icon ? ' with-icon' : '')
	const classes = ' '+props.classes
	const attr = {...props.attr}
	if(BtnTag === 'button' && !attr.type){
		attr.type = 'button'
	}
	return (
		<BtnTag className={
			'btn btn-'+props.settings.size+' btn-'+props.settings.type+' '+
			props.settings.color+iconStatus+classes
		} {...attr}>
			{icon}
			<span className="btn-text">{props.text}</span>
		</BtnTag>
	)
}

Buttons.defaultProps = {
	tag: 'button', text: 'Button', classes: '',
	settings: {size: 'lg', type: 'light', color: 'blue'},
	icon: {name: '', iconOnly: false},
	attr: {}
}

/*
Example:
<Buttons tag={'button'}
	settings={{
		size: 'lg', // required
		type: 'light', // required
		color: 'blue' // required
	}}
	text={'Text'}
	icon={{ name: 'blocks', iconOnly: true|false }} // optional
	attr={{ }} // optional
	classes={'some classes'} // optional
/>
*/

export function FloatingButton(props){
	const BtnTag = props.tag;
	const classes = (props.classes ? ' '+props.classes : '');
	return (
		<BtnTag className={'floating-btn flex-row items-center content-center text-white'+classes}
		{...props.attr}>
			{props.text}
		</BtnTag>
	);
}

/*
Example:
<FloatingButton
	text={'Text'}
	tag={'button'} // optional
	attr={{ }} // optional
	classes={'some classes'} // optional
/>
*/

export function ButtonGroup(props){
	const Tag = (props.tag ? props.tag : 'div');
	const classes = (props.classes ? ' '+props.classes : '');

	return (
		<Tag className={'btn-group'+classes} {...props.attr}>
			{props.buttons}
		</Tag>
	);
}

/*
Example:
<ButtonsGroup
	buttons={}
	tag={'div'} // optional
	attr={{ }} // optional
	classes={'some classes'} // optional
/>
*/