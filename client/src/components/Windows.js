import {useRef, useEffect} from 'react';
import {Button} from './Buttons';
import {SVGIcons} from './Misc';

export function Modal(props){
    console.log(props.size)
    const modalRef = useRef()
    const classes = `modal ${props.size}` + (props.classes ? ` ${props.classes}` : '')
    const footerAlign = props.footerAlign ? ` ${props.footerAlign}` : props.footerAlign    

    useEffect(() => {
        const modal = modalRef.current;
        let modalOverlay = modal.children[0];
        let modalContent = modalOverlay.children[0];

        if(props.shown){
            modal.classList.add('shown')
            modalOverlay.classList.add('shown')
            modalContent.classList.add('shown')
        }
        else{
            if(modal.classList.contains('shown')){
                modalContent.classList.remove('shown')
                modalOverlay.classList.remove('shown')
                modalOverlay.addEventListener('transitionend', () => {
                    modal.classList.remove('shown')
                }, {once: true})
            }
        }
    }, [props.shown])

    return (
      	<section className={classes} ref={modalRef} {...props.attr}>
      		<div className="overlay">
      			<div className="modal-content">
      			  	<div className="modal-header">
      			  	  	<h6 className='heading text-medium text-dark-75'>
                            {props.heading}
                        </h6>
      			  	  	<button className="cls-modal text-blue" type="button"
                        onClick={props.toggleModal}>
                            &times;
                        </button>
      			  	</div>
      			  	<div className="modal-body">
      			  		{props.body}
      			  	</div>
      			  	<div className={'modal-footer '+footerAlign}>
                        {props.footer}
                    </div>
      			</div>  		
      		</div>          	
      	</section>
    )
}

Modal.defaultProps = {
    heading: 'Heading', // String|JSX
    body: 'Lorem ipsum', // String|JSX
    size: '',
    footer: '', // String|JSX
    footerAlign: '', // String|JSX - 'left'|'center'|'right'
    shown: false, // Boolean - Must from parent's state
    toggleModal: () => {alert('Please defined the toggleModal function')},
    classes: '', // String
	attr: {} // Object
}

export function ConfirmPopup(props){
    const popupRef = useRef()
    const classes = props.classes ? ` ${props.classes}` : ''

    useEffect(() => {
        const popup = popupRef.current;
        let popupOverlay = popup.children[0];
        let popupContent = popupOverlay.children[0];

        if(props.shown){
            popup.classList.add('shown')
            popupOverlay.classList.add('shown')
            popupContent.classList.add('shown')
        }
        else{
            if(popup.classList.contains('shown')){
                popupContent.classList.remove('shown')
                popupOverlay.classList.remove('shown')
                popupOverlay.addEventListener('transitionend', () => {
                    popup.classList.remove('shown')
                }, {once: true})
            }
        }
    }, [props.shown])

    return (
      	<section className={'confirm-popup'+classes} ref={popupRef} {...props.attr}>
      		<div className="overlay">
      			<div className="confirm-popup-content text-center">


                      <div className='text-semi-bold flex-col content-center'>
                          {props.icon ? <SVGIcons name={props.icon} color={props.iconColor} /> : ''}                          
                          {props.title}
                      </div>
                      <div>{props.body}</div>
                      <div>
                          <Button type="light" size={'sm'} color={props.confirmBtnColor} text={props.confirmText} attr={{
                              onClick: () => {
                                  props.confirmCallback()
                                  props.togglePopup()
                              }
                          }}/>
                          {props.cancelText ? 
                            <Button type="light" size={'sm'} color={props.cancelBtnColor} text={props.cancelText} attr={{
                                style: {marginLeft: '1rem'},
                                onClick: () => {
                                    props.cancelCallback()
                                    props.togglePopup()
                                }
                            }}/>                              
                          : ''}                      
                      </div>
      			</div>  		
      		</div>          	
      	</section>
    )
}

ConfirmPopup.defaultProps = {
    icon: '', // String
    iconColor: 'blue', // String
    title: 'Lorem ipsum', // String|JSX
    body: 'Lorem ipsum', // String|JSX
    confirmText: 'Yes', // String|JSX
    cancelText: '', // String|JSX
    confirmBtnColor: 'blue', // String
    cancelBtnColor: 'red', // String
    shown: false, // Boolean - Must from parent's state
    togglePopup: () => {alert('Please defined the togglePopup function')},
    confirmCallback: () => {},
    cancelCallback: () => {},
    classes: '', // String
	attr: {} // Object
}