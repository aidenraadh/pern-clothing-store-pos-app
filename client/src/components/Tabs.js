import React from 'react';

export default class Tabs extends React.Component{
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
			const newPanelStats = state.panelStats.map((stats) => {
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
			const newPanelStats = state.panelStats.map((stats) => {
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
		const tabs_classes = (this.props.tabs_classes ? ' '+this.props.tabs_classes : '');
		const tab_content_classes = (this.props.tab_content_classes ? ' '+this.props.tab_content_classes : '');		
		return (
			<>
			<ul className={'tabs'+tabs_classes} role="tablist" {...this.props.tabs_attr}>
			{this.props.tabs.map((tab, key) => (

			  <li key={key} className="tab-item">
			    <a className={'tab-link text-dark-2 '+(tab.panelID === this.state.currentPanelID ? 'active' : '')}
			    	href={'#'+tab.panelID}
			    	aria-controls={tab.panelID} aria-selected={(tab.panelID === this.state.currentPanelID ? 'true' : 'false')}
			    	role="tab" data-toggle="tab" onClick={(e) => this.changeCurrentPanel(e, tab.panelID)}
			    >
			    	{tab.link}
			    </a>
			  </li>
			  
			))}
			</ul>
			<div className={'tab-content'+tab_content_classes} {...this.props.tab_content_attr}>
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
			</>
		);
	}
}

/*
Example:

<Tabs
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
	tab_classes={'some class'} // optional
	tab_content_classes={'some class'} // optional
	tabs_attr={'some class'} // optional
	tab_content_attr={'some class'} // optional
/>
*/