import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import SVGIcons from './SVGIcons'
import {Button} from './Buttons'

export function Dropdown(props){
    const [tooltipDisplay, setTooltipDisplay] = useState(false)
	const [tooltipVisible, setTooltipVisible] = useState(false)
    const [referenceElement, setReferenceElement] = useState(null)
    const [popperElement, setPopperElement] = useState(null)
	const {styles, attributes} = usePopper(referenceElement, popperElement, {
		placement: props.placement,
		modifiers: [
			{
				name: 'offset',
				options: {
					offset: [0, 8],
				},
			},			
		]		
	})
	const classes = `dropdown${props.classes ? ' ' + props.classes : ''}`
	const buttonProps = {...props.button}
	buttonProps.classes = `dropdown-btn${props.button.classes ? ' ' + props.button.classes : ''}`
	
	useEffect(() => {
		if(popperElement){
			if(tooltipVisible){
				popperElement.classList.remove('hidden')
				popperElement.setAttribute('data-show', '')
				setTooltipDisplay(true)
			}
			else{
				popperElement.classList.add('hidden')
				setTooltipDisplay(false)
			}
		}		
	}, [tooltipVisible])

	useEffect(() => {
		if(popperElement && tooltipDisplay === false){
			popperElement.addEventListener('transitionend', () => {
				popperElement.removeAttribute('data-show')
			}, {once: true})			
		}
	}, [tooltipDisplay])

	return (
		<div className={classes} {...props.attr}>
			<Button
				{...buttonProps}
				attr={{
					ref: setReferenceElement,
					onClick: () => {setTooltipVisible(state => !state)},
					onBlur: () => {setTooltipVisible(state => !state)}
				}}
			/>
			<div ref={setPopperElement} className='tooltip hidden' style={styles.popper} {...attributes.popper}>
				<ul className='list'>
					{props.items.map((item, index) => (
						<li key={index}>{item}</li>
					))}
				</ul>
			</div>
		</div>
	)
}

Dropdown.defaultProps = {
	// All props of <Button/> component
	button: {
		text: 'Dropdown'
	},
	placement: 'bottom-start', // 'bottom-start'|'bottom-end'|'top-start'|'top-end'|'left-start'|'left-end'|'right-start'|'right-end'
	items: [
		<a href='#'>Action here</a>, 
		<a href='#'>Another action here</a>, 
		<a href='#'>Another action here</a>
	],
	classes: '',
	attr: {},
}

export function UserThumbnail(props){
	const classes = props.classes ? ` ${props.classes}` : ''
	const Tag = props.tag

	return (
		<Tag className={'user-thumbnail'+classes} {...props.attr}>
			{props.imgUrl ? <img src={props.imgUrl} alt={'User avatar'} /> : ''}
			<span className="user-name">{props.userName}</span>
		</Tag>
	);
}

UserThumbnail.defaultProps = {
	tag: 'div', // String
	userName: 'Name', // String
	imgUrl: 'images/user_default_thumbnail.jpg', // String
	classes: '', // String
	attr: {}, // Objects
}


export function Separator(props){
	const Tag = props.tag
	const classes = `separator${props.classes ? ' '+props.classes : props.classes}`
	if(Tag === 'hr'){
		return <hr className={classes} {...props.attr}/>
	}
	return (
		<Tag className={classes} {...props.attr}></Tag>
	)
}

Separator.defaultProps = {
	tag: 'hr', // String
	classes: '', // String
	attr: {}, // Objects
}


export class Collapsible extends React.Component{
    constructor(props){
		super(props);
		this.state = {
			maxHeight: 0,
		};
		this.myRef = React.createRef();
	}

	componentDidUpdate(prevProps){

		if(prevProps.expanded !== this.props.expanded || prevProps.body !== this.props.body){

			this.setState({
				maxHeight: (this.props.expanded ? this.myRef.current.scrollHeight+'px' : 0)
			});
		}
	}

    render(){
		const Tag = (this.props.tag ? this.props.tag : 'div');

		const classes = `collapsible` +
		(this.props.expanded ? ' expanded' : '') +
		(this.props.classes ? ' '+this.props.classes : '')
		
		let attr = {...this.props.attr};
		attr['style'] = (attr['style'] ?
			{...attr['style'], maxHeight: this.state.maxHeight} : {maxHeight: this.state.maxHeight}
		);

		return (
			<Tag id={this.props.name} className={classes}
			{...attr} ref={this.myRef}>
				{this.props.body}
			</Tag>
		);
    }
}

Collapsible.defaultProps = {
	body: 'Lorem ipsum',
	expanded: false, // Boolean
	toggleExpand: () => {alert('Please set the toggle expand')},
	tag: 'div',
	classes: '',
	attr: {}
}

export function Label(props){
	const Tag =  props.tag
	const classes = `label ${props.type} ${props.color}` +
	(props.classes ? ' '+props.classes : '')

	return (
		<Tag className={classes} {...props.attr}>
			{props.text}
		</Tag>		
	);
}

Label.defaultProps = {
	tag: 'span', // String
	text: 'Label', // String / JSX
	type: 'light', // String 'solid|light'
	color: 'blue', // String 'blue|red|green|purple|orange|gray'
	classes: '',
	attr: {}
}

/*
Example:

<Label
	type={'solid|light'}
	color={'blue|red|green|purple|orange|gray'}
	text={'Lorem ipsum'}
	tag={'span'} // optional
	classes={'some class'} // optional
	attr={{someattr: ''}} // optional
/>
*/

export class Accordion extends React.Component{
    constructor(props){
		super(props);
		this.state = {
			maxHeight: 0,
		};
		this.bodyWrapperRef = React.createRef();
	}
	componentDidUpdate(prevProps){

		if(prevProps.expanded !== this.props.expanded || prevProps.body !== this.props.body){

			this.setState({
				maxHeight: (this.props.expanded ? this.bodyWrapperRef.current.scrollHeight+'px' : 0)
			});
		}
	}
    render(){
		const Tag = (this.props.tag ? this.props.tag : 'div')
		const HeadingTag = (this.props.heading_tag ? this.props.heading_tag : 'h6')
		const classes = `accordion ${this.props.type}` +
			(this.props.expanded ? ' expanded' : '') +
			(this.props.classes ? ` ${this.props.classes}` : '')

		return (
			<Tag className={classes} {...this.props.attr}>
				<header className="flex-row content-space-between items-center">
					<HeadingTag className="heading text-dark-75 text-medium flex-row items-center">
						{
							this.props.heading_icon ? 
							<SVGIcons name={this.props.heading_icon} color={'blue'}/> : ''
						}					
						{this.props.heading}
					</HeadingTag>
					<button type="button" className="toggle flex-row content-end items-center"
					onClick={this.props.toggleExpand}>
						<SVGIcons name={'angle_double_right'} color={'blue'}/>							
						<span className="sr-only">Toggle accordion</span>
					</button>
				</header>
				<div className="body-wrapper" ref={this.bodyWrapperRef}
				style={{'maxHeight': this.state.maxHeight}}>
					<div className="body">
						{this.props.body}
					</div>
				</div>
			</Tag>
		);
    }
}

Accordion.defaultProps = {
	heading: 'Heading',
	body: 'Lorem ipsum',
	expanded: false, // Boolean
	toggleExpand: () => {alert('Please set the toggle expand')},
	type: 'white', // 'solid' || 'white'
	tag: 'div',
	heading_tag: 'h6',
	heading_icon: 'blocks', // SVG icons name
	classes: '',
	attr: {}
}