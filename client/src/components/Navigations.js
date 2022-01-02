import React from 'react';
import {SVGIcons} from './Misc.js';

export default class Navigations extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			show_topbar: false,
		};
	}

	render(){
		return (
			<nav>
				<section className="topbar">
					<a href={this.props.app_url}
					className="topbar-item app-brand flex-row content-center items-center">
						<img src={this.props.app_logo_url} />
					</a>
					<div className="left-widgets">
						{(() => {
							let LeftWidgets_JSX = [];
							if(this.props.sidebar_items){
								LeftWidgets_JSX.push(
									<button type="button" 
									className="topbar-item show-sidebar-btn"
									onClick={this.props.toggleSidebar}>
										<SVGIcons
											name={'article'} color={'blue'}
											attr={{style: {width: '3rem'}}}
										/>
									</button>
								);
							}
							if(this.props.left_widgets){
								this.props.left_widgets.forEach((item) => {
									LeftWidgets_JSX.push(item);
								});
							}
							return (
								LeftWidgets_JSX.length === 0 ? '' :
								<ul>
									{LeftWidgets_JSX.map((item, key) => (

									<li key={key}>
										{item}
									</li>

									))}
								</ul>
							);
						})()}
					</div>
					<ul className="right-widgets">
						{this.props.right_widgets ? 
						this.props.right_widgets.map((item, key) => (

						<li key={key}>
							{item}
						</li>

						)) : ''
						}
					</ul>
				</section>
				<div className="sidebar-main-navs-container flex-col">
					{this.props.main_navs_items ?
					<ul className="main-navs">
						{this.props.main_navs_items.map((item, key) => (
						<li key={key}>{item}</li>
						))}
					</ul> : ''		
					}
					{this.props.sidebar_items ? 
					<section className={'sidebar'+(this.props.sidebar_shown ? ' shown' : '')}>
						<button type="button" className="hide-sidebar-btn"
						onClick={this.props.toggleSidebar}>
							&times;
						</button>								
						<ul className="sidebar-items-container">
						{this.props.sidebar_items.map((item, key) => (
							<li key={key}>{item.content}</li>
						))}
						</ul>		
					</section> : ''
					}
				</div>
			</nav>
		);//		
	}
}

/*
Example:

<Navigations
	main_navs_items={[
		{content: 
			<><SVGIcons name={'layers'} color={''} />
			<span className="text">Dashboard</span></>,
			attr: {onClick: (() => this.changeView(0))},
			active: (this.state.current_view === 0 ? true : false),
		},																													
	]}
	sidebar_items={[
		{content: 
			<><SVGIcons name={'layers'} color={''} />
			<span className="text">Dashboard</span></>,
			attr: {onClick: (() => this.changeView(0))},
			active: (this.state.current_view === 0 ? true : false),
		},																													
	]}				
/>
*/