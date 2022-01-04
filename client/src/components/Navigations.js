import {SVGIcons} from './Misc.js';

function Navigations(props){
	return (
		<nav>
			<section className="topbar">
				<a href={props.appUrl}
				className="topbar-item app-brand flex-row content-center items-center">
					{props.appLogoUrl ? <img src={props.appLogoUrl} /> : ''}
				</a>
				<div className="left-widgets">
					<button type="button" 
					className="topbar-item show-sidebar-btn"
					onClick={props.toggleSidebar}>
						<SVGIcons
							name={'article'} color={'blue'}
							attr={{style: {width: '3rem'}}}
						/>
					</button>
					<ul>
						{props.leftWidgets.map((item, key) => (
							<li key={key}>
								{item}
							</li>
						))}
					</ul>				
				</div>
				<ul className="right-widgets">
					{props.rightWidgets.map((item, key) => (
						<li key={key}>
							{item}
						</li>
					))}
				</ul>
			</section>

			<section className={'sidebar'+(props.sidebarShown ? ' shown' : '')}>
				<button type="button" className="sidebar-item toggle-sidebar-btn"
				onClick={props.toggleSidebar}>
					<SVGIcons
						name={'angle_double_right'} color={'blue'}
						attr={{style: {width: '3rem'}}}
					/>
				</button>								
				<ul className="sidebar-items-container">
				{props.sidebarItems.map((item, key) => (
					<li key={key}>
						<a className={'sidebar-item'+(item.active ? ' active' : '')}>
                            <SVGIcons name={item.icon ? item.icon : 'layers'} color={''} />
                            <span className="text">{item.text ? item.text : 'Menu'}</span>  
						</a>
					</li>
				))}
				</ul>		
			</section>
		</nav>	
	)	
}

Navigations.defaultProps = {
	appUrl: 'Test App', // String
	appLogoUrl: '', // String
	leftWidgets: [], // Array of string or JSX
	rightWidgets: [], // Array of string or JSX
	sidebarItems: [] // Array of objects
}

export default Navigations


/*
Example:

<Navigations
	sidebarItems={[
		{content: 
			<><SVGIcons name={'layers'} color={''} />
			<span className="text">Dashboard</span></>,
			attr: {onClick: (() => this.changeView(0))},
			active: (this.state.current_view === 0 ? true : false),
		},																													
	]}				
/>
*/