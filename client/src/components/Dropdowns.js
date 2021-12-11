import React from 'react';

export default function Dropdowns(props){
	const pull = (props.pull ? ' pull-'+props.pull : '');
	const container_classes = (props.container_classes ? ' '+props.container_classes : '');

    return (
        <div className={'dropdown '+props.alignment+pull+container_classes} {...props.container_attr}>
            {props.toggle_button}
            <section className={'dropdown-menu'+(props.shown ? ' shown' : '')}>
                {props.items}
            </section>
        </div>        
    );
}

/* 
Example:

<Dropdowns
	shown={true|false}
	toggle_button={  } // Some button in JSX with 'dropdown-toggle' class
	alignment={'top|right|bottom|left'}

	pull={'top|right|bottom|left'} // optional
	// use 'top' or 'bottom' for 'left' and 'right' alignment
	// use 'left' or 'right' for 'top' and 'bottom' alignment

	items={<>
		<a className="dropdown-item" href="#">Item 1</a>
		<a className="dropdown-item" href="#">Item 2</a>
		<a className="dropdown-item" href="#">Item 3</a>
		<hr /> // optional
		<a className="dropdown-item" href="#">Item 4</a>
		<a className="dropdown-item" href="#">Item 5</a>
	</>}
	container_classes={'some classes'} // optional
	container_attr={{  }} // optional
/>
 */