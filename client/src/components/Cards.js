import React from 'react';
import {SVGIcons} from './Misc.js';

export function SimpleCard(props){
	const CardTag = props.cardTag
	const HeadingTag = props.headingTag 
	const container_classes = props.container_classes ? ' '+props.container_classes : props.container_classes

	return (
		<CardTag className={'card simple-card'+container_classes} {...props.container_attr}>
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
	container_attr: {},
	container_classes: ''
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

export class TabbedCard extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			panelStats: this.props.tabs.map((tab) => {
				if(tab.panelID === this.props.currentPanelID){
					return {id: tab.panelID, active: true, shown: true};
				}
				else{
					return {id: tab.panelID, active: false, shown: false};
				}
			}),

			currentPanelID: this.props.currentPanelID
		};

		this.changeCurrentPanel = this.changeCurrentPanel.bind(this);
		this.showCurrentPanel = this.showCurrentPanel.bind(this);
	}

	changeCurrentPanel(e, panelID){
		e.preventDefault();
		this.setState((state) => {
			const newPanelStats = state.panelStats.map(stats => {
				if(stats.id === state.currentPanelID){
					return {id: stats.id, active: true, shown: false};
				}
				else{
					return stats;
				}
			});

			return {
				panelStats: newPanelStats, currentPanelID: panelID
			};
		});
	}

	showCurrentPanel(){
		this.setState((state) => {
			const newPanelStats = state.panelStats.map(stats => {
				if(stats.id === state.currentPanelID){
					return {id: stats.id, active: true, shown: true};
				}
				else{
					return {id: stats.id, active: false, shown: false};
				}
			});

			return {
				panelStats: newPanelStats
			};
		});
	}	

	render(){
		const containerClasses = this.props.containerClasses ? ' '+this.props.containerClasses : this.props.containerClasses

		return (
			<div className={'card tabbed-card'+containerClasses} {...this.props.containerAttr}>
				<ul className="tabs"role="tablist">
				{this.props.tabs.map((tab, key) => (
	
				  <li key={key} className="tab-item">
				    <a className={'tab-link text-medium text-dark-75 '+(tab.panelID === this.state.currentPanelID ? 'active' : '')}
				    	href={'#'+tab.panelID}
				    	aria-controls={tab.panelID} aria-selected={(tab.panelID === this.state.currentPanelID ? 'true' : 'false')}
				    	role="tab" data-toggle="tab" onClick={(e) => this.changeCurrentPanel(e, tab.panelID)}
				    >
				    	{tab.link}
				    </a>
				  </li>
				  
				))}
				</ul>
				<div className="tab-content">
				{
					this.props.tabs.map((tab, key) => (
				  	<div key={key} className={
				  			'tab-pane '+
				  			(this.state.panelStats[key].active ? 'active ' : '')+
				  			(this.state.panelStats[key].shown ? 'shown' : '')
				  		}
				  		id={tab.panelID} aria-labelledby={tab.panelID+'-tab'} role="tabpanel"
				  		onTransitionEnd={this.showCurrentPanel}
				  	>
				  	  {tab.panelContent}
				  	</div>	
					))
				}
				</div>
			</div>
		);
	}
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

/*
Example:

<TabbedCard
	tabs={[
		{link: 'Home', panelID: 'home', panelContent:
			'This is home tab.'
		},
		{link: 'Profile', panelID: 'profile', panelContent:
			'This is profile tab.'
		},
		{link: 'Contact', panelID: 'contact', panelContent:
			'This is contact tab.'
		},										
	]}
	currentPanelID={'home'}
	containerClasses={'some class'} // optional
	containerAttr={{  }} // optional
/>
*/

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

export class ToolCard extends React.Component{
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
		const Tag = (this.props.tag ? this.props.tag : 'div');
		const HeadingTag = (this.props.heading_tag ? this.props.heading_tag : 'h6');
		const expanded = (this.props.expanded ? ' expanded' : '');
		const classes = (this.props.classes ? ' '+this.props.classes : '');

		return (
			<Tag className={'card simple-card tool-card'+expanded+classes} {...this.props.attr}>
				<header className="card-header flex-row items-center content-space-between">
					<HeadingTag className="heading text-dark-75 text-medium">
						{this.props.heading}
					</HeadingTag>
					<section className="card-actions flex-row items-center">						
						{this.props.left_side_actions}
						{this.props.toggle_button}
						{this.props.right_side_actions}
					</section>			
				</header>
				<div className="body-wrapper" ref={this.bodyWrapperRef}
				style={{'maxHeight': this.state.maxHeight}}>
					<div className="card-body">
						{this.props.body}
					</div>
					{(this.props.footer ?
					<footer className="card-footer">
						{this.props.footer}
					</footer> : ''
					)}
				</div>
			</Tag>
		);
    }
}

/*
Example:

<ToolCard
	heading={'Heading'}
	body={'body'}
	expanded={true|false} // a parent state representing whether 
	// the tool card is exapnded or not
	toggle_button={btn_jsx} // A button with 'toggle-btn' class 
	// that can toggle to true or false the expanded props
	left_side_actions={btn_jsx} // Some action buttons at the left side
	// of the toggle button
	right_side_actions={btn_jsx} // Some action buttons at the right side
	// of the toggle button	
	tag={'div'} // optional
	heading_tag={'h6'} // optional
	classes={'some classes'} // optional
	attr={{  }} // optional
/>
*/

export function KanbanBoard(props){
	const CardTag = (props.card_tag ? props.card_tag : 'section');
	const HeadingTag = (props.heading_tag ? props.heading_tag : 'h6');
	const type = (props.type ? ' '+props.type : ' primary');
	const color = (props.color ? ' '+props.color : ' blue');
	const classes = (props.classes ? ' '+props.classes : '');

	return (
        <CardTag className={'kanban-board'+type+color+classes} {...props.attr}>
            <HeadingTag className="heading text-medium">{props.heading}</HeadingTag>
            <div className="body">
				{props.body}                  
            </div>
        </CardTag>		
	);
}

/* 
Example: 

<KanbanBoard
	heading={'Heading'}
	body={'body'}
	type={'primary|light'} // optional
	color={'red|green|blue|orange|purple'} // optional
	classes={'someclasses'} // optional
	attr={{}} // optional
/>
 */