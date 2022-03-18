import {useState, useRef, useEffect} from 'react';
import React from 'react';
import {SVGIcons} from './Misc.js';
import {Button} from './Buttons.js';

export function SimpleCard(props){
	const CardTag = props.cardTag
	const HeadingTag = props.headingTag 
	const containerClasses = props.containerClasses ? ' '+props.containerClasses : props.containerClasses

	return (
		<CardTag className={'card simple-card'+containerClasses} {...props.containerAttr}>
			<header className="card-header flex-row items-center content-space-between">
				<HeadingTag className="heading text-dark-75 text-medium">{props.heading}</HeadingTag>
				{(props.action ?
				<section className="card-actions flex-row items-center">
					{props.action}
				</section> : ''				
				)}
			</header>
			<div className="card-body">
				{props.body}
			</div>
			{(props.footer ?
			<footer className="card-footer">
				{props.footer}
			</footer> : ''
			)}
		</CardTag>
	);//
}

SimpleCard.defaultProps = {
	cardTag: 'div', 
	heading: 'Heading', headingTag: 'h6',
	body: 'Lorem ipsum', // String or JSX
	action: '', // String or JSX
	footer: '', // String or JSX
	containerAttr: {},
	containerClasses: ''
}

export function PlainCard(props){
	const CardTag = props.cardTag
	const classes = props.classes ? ' '+props.classes : props.classes

	return (
		<CardTag className={'card plain-card'+classes} {...props.attr}>
			{props.body}
		</CardTag>
	);	
}

PlainCard.defaultProps = {
	cardTag: 'div', 
	body: 'Lorem ipsum', // String or JSX
	attr: {},
	classes: ''
}

export function TabbedCard(props){
	const [panelStates, setPanelStates] = useState(props.tabs.map(tab => (
		tab.panelID === props.currentPanelID ?
		{id: tab.panelID, active: true, shown: true} :
		{id: tab.panelID, active: false, shown: false}
	)))

	const [currentPanelID, setCurrentPanelID] = useState(props.currentPanelID)

	const containerClasses = props.containerClasses ? 
	' '+props.containerClasses : props.containerClasses

	// Hide the current panel and change the current panel ID
	const changePanel = (e, panelID) => {
		e.preventDefault()
		// Hide the current panel
		setPanelStates(panelStates => panelStates.map(state => (
			state.id === currentPanelID ? {...state, shown: false} : state
		)))
		// Change the current panel ID
		setCurrentPanelID(panelID)
	}

	// Activate and show the current panel and disable the previous panel
	const showPanel = () => {
		setPanelStates(panelStates => panelStates.map(state => (
			state.id === currentPanelID ? 
			{...state, active: true, shown: true} : {...state, active: false}
		)))
	}

	return (
		<div className={'card tabbed-card'+containerClasses} {...props.containerAttr}>
			<ul className="tabs"role="tablist">
			{props.tabs.map((tab, key) => (
			  <li key={key} className="tab-item">
			    <a className={'tab-link text-medium text-dark-75 '+(tab.panelID === currentPanelID ? 'active' : '')}
			    	href={'#'+tab.panelID}
			    	aria-controls={tab.panelID} aria-selected={(tab.panelID === currentPanelID ? 'true' : 'false')}
			    	role="tab" data-toggle="tab" onClick={e => changePanel(e, tab.panelID)}
			    >
			    	{tab.link}
			    </a>
			  </li>
			))}
			</ul>
			<div className="tab-content">
			{
				props.tabs.map((tab, key) => (
			  	<div key={key} className={
			  			'tab-pane '+
			  			(panelStates[key].active ? 'active ' : '')+
			  			(panelStates[key].shown ? 'shown' : '')
			  		}
			  		id={tab.panelID} aria-labelledby={tab.panelID+'-tab'} role="tabpanel"
			  		onTransitionEnd={showPanel}
			  	>
			  	  {tab.panelContent}
			  	</div>	
				))
			}
			</div>
		</div>
	);
}

TabbedCard.defaultProps = {
	tabs: [ // Array of objects
		{link: 'Home', panelID: 'home', panelContent:
			'This is home tab.'
		},
		{link: 'Profile', panelID: 'profile', panelContent:
			'This is profile tab.'
		},
		{link: 'Contact', panelID: 'contact', panelContent:
			'This is contact tab.'
		},										
	],
	currentPanelID: 'home', // String
	containerClasses: '', 
	containerAttr: {}
}

export function StatsCard(props){
	const CardTag = props.cardTag
	const type = ' '+props.type
	const color = ' '+props.color 
	const classes = props.classes ? ' '+props.classes : props.classes

	return (
		<CardTag className={'stats-card'+type+color+classes} {...props.attr}>
			<span className="main-label">{props.title}</span>
			<span className="secondary-label">{props.subTitle}</span>
			<span className="number-label">
				{props.icon ? <SVGIcons name={props.icon} /> : ''}				
				{props.number}
			</span>			
		</CardTag>
	);
}

StatsCard.defaultProps = {
	cardTag: 'div', 
	type: 'primary', // 'primary'|'light'
	color: 'blue', // 'red'|'blue'|'yellow'|'green'|'purple'
	title: 'Title', // String or JSX
	subTitle: 'Subtitle', // String or JSX
	number: '3000', // String or JSX
	icon: 'cart', // String
	attr: {},
	classes: ''
}

export function ToolCard(props){
	const [maxHeight, setMaxHeight] = useState(0)
	const bodyWrapperRef = useRef()
	const Tag = props.tag 
	const HeadingTag = props.headingTag
	const expand = props.expand ? ' expanded' : ''
	const classes = props.classes ? ` ${props.classes}` : ''	

	useEffect(() => {
		setMaxHeight(
			props.expand ? bodyWrapperRef.current.scrollHeight+'px' : 0
		)
	}, [props.expand, maxHeight])

	return (
		<Tag className={'card simple-card tool-card'+expand+classes} {...props.attr}>
			<header className="card-header flex-row items-center content-space-between">
				<HeadingTag className="heading text-dark-75 text-medium">
					{props.heading}
				</HeadingTag>
				<section className="card-actions flex-row items-center">						
					{props.leftSideActions}
					{props.toggleButton}
					{props.rightSideActions}
				</section>			
			</header>
			<div className="body-wrapper" ref={bodyWrapperRef}
			style={{'maxHeight': maxHeight}}>
				<div className="card-body">
					{props.body}
				</div>
				{(props.footer ?
				<footer className="card-footer">
					{props.footer}
				</footer> : ''
				)}
			</div>
		</Tag>
	);	
}

ToolCard.defaultProps = {
	tag: 'section', 
	headingTag: 'h6', // String
	heading: 'Heading', // String or JSX
	body: 'Lorem ipsum', // String or JSX
	footer: '', // String or JSX
	expand: false, // Boolean - This must be from the parent's state
	toggleButton: <Button // Button JSX with 'toggle-btn' class, and a handler that change expand state inside parent
		size={'sm'} type={'light'} color={'blue'}
		iconName={'angle_up'} iconOnly={true}
		classes={'toggle-btn'}
		attr={{
			onClick: () => {alert('Please attach handler that change expand property')}
		}}
	/>,
	leftSideActions: null, // JSX
	rightSideActions: null, // JSX
	attr: {},
	classes: '' // String
}

export function KanbanBoard(props){
	const CardTag = props.cardTag
	const HeadingTag = props.headingTag 
	const type = ` ${props.type}`
	const color = ` ${props.color}`
	const classes = props.classes ? ` ${props.classes}` : ''

	return (
        <CardTag className={'kanban-board'+type+color+classes} {...props.attr}>
            <HeadingTag className="heading text-medium">{props.heading}</HeadingTag>
            <div className="body">
				{props.body}                  
            </div>
        </CardTag>		
	);
}

KanbanBoard.defaultProps = {
	cardTag: 'section', // String
	headingTag: 'h6', // String
	heading: 'Heading', // String or JSX
	body: 'Lorem ipsum', // String or JSX
	type: 'primary', // String
	color: 'blue', // String
	attr: {},
	classes: '' // String
}