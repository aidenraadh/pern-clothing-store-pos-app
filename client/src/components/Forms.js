import React from 'react';
import {Button} from './Buttons'

export function TextInput(props){
	const classes = `base-input ${props.type} ${props.size}-input` +
		(props.containerClasses ? ` ${props.containerClasses}` : props.containerClasses)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}

	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<input {...formAttr} />
		</span>		
	)
}

TextInput.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'solid'
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}

export function TextInputWithBtn(props){
	const classes = `base-input ${props.type} ${props.size}-input with-btn` + (props.containerClasses ? 
		` ${props.containerClasses}` : props.containerClasses
	)
	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}	
	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<input {...formAttr} />
			<Button type={'light'} color={props.btnIconColor} size={props.size} 
				iconName={props.btnIconName} iconOnly={'true'} attr={{...props.btnAttr}}
			/>
		</span>		
	)
}

TextInputWithBtn.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'solid'
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	btnIconName: 'update',
	btnIconColor: 'blue',
	btnAttr: {},
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}


export function Select(props){
	const classes = `base-input ${props.type} ${props.size}-input` +
		(props.containerClasses ? ` ${props.containerClasses}` : props.containerClasses)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}	
	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<select {...formAttr}>

			{props.options.map((option, key) => (
				<option key={key} value={option.value} {...option.attr}>
					{(option.text ? option.text : option.value)}
				</option>
			))}

			</select>
		</span>	
	);
}

Select.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'solid'
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	options: [ // Array of objects
		{value: 'Option 1', text: 'Option 1', attr: {}},
		{value: 'Option 2', text: 'Option 2', attr: {}},
	], 
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}


export function Textarea(props){
	const classes = `base-input ${props.type} ${props.size}-input` +
		(props.containerClasses ? ` ${props.containerClasses}` : props.containerClasses)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}		

	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<textarea {...formAttr}></textarea>
		</span>	
	);
}

Textarea.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'solid'
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}

export function TextInputAddon(props){
	const classes = `addon-input ${props.size}-input` +
		(props.containerClasses ? ` ${props.containerClasses}` : props.containerClasses)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}		
	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<span className="flex-row">
				<span className="addon" aria-hidden="true">{props.addon}</span>
				<input {...formAttr} />
			</span>
		</span>			
	);
}

TextInputAddon.defaultProps = {
	formName: '', // String
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	addon: 'Addon', // String|JSX
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}

export function SelectAddon(props){
	const classes = `addon-input ${props.size}-input` +
		(props.containerClasses ? ` ${props.containerClasses}` : props.containerClasses)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}		
	return (
		<span className={classes} {...props.containerAttr}>
			{props.label ? <label htmlFor={props.formName}>{props.label}</label> : ''}
			<span className="flex-row">
				<span className="addon" aria-hidden="true">{props.addon}</span>
				<select {...formAttr}>
				{props.options.map((option, key) => (
					<option key={key} value={option.value} {...option.attr}>
						{(option.text ? option.text : option.value)}
					</option>
				))}
				</select>				
			</span>			
		</span>	
	);
}

SelectAddon.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'solid'
	size: 'md', // String - 'sm'|'md'|'lg'
	label: '', // String|JSX
	options: [ // Array of objects
		{value: 'Option 1', text: 'Option 1', attr: {}},
		{value: 'Option 2', text: 'Option 2', attr: {}},
	], 
	addon: 'Addon', // String|JSX
	containerClasses: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}

export function Checkbox(props){
	const classes = `multi-choice checkbox ${props.type}` +
		(props.classes ? ` ${props.classes}` : props.classes)

	let formAttr = {...props.formAttr, value: props.value}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}		
	return (
		<label className={classes} {...props.containerAttr}>
			<span className="choice-name">{props.label ? props.label : props.value}</span>
			<input type="checkbox" {...formAttr}/>
			<span className="checkmark">
				<span></span>
			</span>
		</label>
	);
}

Checkbox.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'basic'
	label: '', // String|JSX
	value: '', // String
	classes: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}

export function Radio(props){
	const classes = `multi-choice radio ${props.type}` + 
		(props.classes ? ` ${props.classes}` : props.classes)

	let formAttr = {...props.formAttr}
	if(props.formName){
		formAttr = {...formAttr,
			id: props.formName, name: props.formName, 
		}
	}		

	return (
		<label className={classes} {...props.containerAttr}>
			<span className="choice-name">{props.label ? props.label : props.value}</span>
			<input type="radio" {...formAttr}/>
			<span className="checkmark">
				<span></span>
			</span>
		</label>
	)//
}

Radio.defaultProps = {
	formName: '', // String
	type: 'outline', // String - 'outline'|'basic'
	label: '', // String|JSX
	value: '', // String
	classes: '', // String
	containerAttr: {}, // Object
	formAttr: {}, // Object
}
