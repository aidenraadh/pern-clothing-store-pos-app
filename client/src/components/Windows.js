import {useRef, useEffect} from 'react';
import {Button} from './Buttons';
import {SVGIcons} from './Misc';

export function Modal(props){
    const modalRef = useRef()
    const classes = props.classes ? ` ${props.classes}` : ''
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
      	<section className={'modal'+classes} ref={modalRef} {...props.attr}>
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
      			  	<div className={'modal-footer'+footerAlign}>
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
                          <Button type="light" size={'sm'} color={'blue'} text={props.confirmText} attr={{
                              onClick: () => {
                                  props.confirmCallback()
                                  props.togglePopup()
                              }
                          }}/>
                          <Button type="light" size={'sm'} color={'red'} text={props.cancelText} attr={{
                                style: {marginLeft: '1rem'},
                                onClick: props.togglePopup
                          }}/>                          
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
    cancelText: 'No', // String|JSX
    shown: false, // Boolean - Must from parent's state
    togglePopup: () => {alert('Please defined the togglePopup function')},
    confirmCallback: () => {alert('Please defined the confirmCallback function')},
    classes: '', // String
	attr: {} // Object
}

// export class LoadingScreen extends React.Component{
//     constructor(props){
//         super(props);
//         this.state = {
//             visibility: false,
//             shown: false,
//         };

//         this.toggleLDS = this.toggleLDS.bind(this);
//         this.concealLDS = this.concealLDS.bind(this);

//     }

//     toggleLDS(show_lds){
//         if(show_lds){
//             this.setState({
//                 visibility: true,
//                 shown: true,
//             });
//         }
//         else{
//             this.setState({ shown: false });
//         }
//     }

//     concealLDS(){
//         if(!this.state.shown){
//             this.setState({ visibility: false });
//         }
//     }

//     componentDidUpdate(prevProps){
//         if(prevProps.lds_shown !== this.props.lds_shown){
//             this.toggleLDS(this.props.lds_shown);
//         }
//     }

//     render(){
//         const visibility = (this.state.visibility ? ' visible' : '');
//         const shown = (this.state.shown ? ' shown' : '');
//         const loader_color = (this.props.loader_color ? ' '+this.props.loader_color : ' white');
//         const overlay = (this.props.overlay ? ' '+this.props.overlay+'-overlay' : ' dark-overlay');

//         return (<>
//             <div className={'loading-screen'+overlay+visibility+shown}
//             aria-hidden="true" onTransitionEnd={this.concealLDS}>
//         	    {(this.props.loading_text ? 
//                 <span className="loading-text">{this.props.loading_text}</span> : ''
//                 )}
//             	<div className={"lds-ripple"+loader_color}>
//             		<div></div>
//             		<div></div>
//             	</div>	
//             </div>
//         </>);
//     }
// }

/*

Example:

<LoadingScreen
    lds_shown={this.state.lds_shown} // Boolean
	overlay={'dark|transparent'} // optional
	loading_text={'Please wait...'} // optional
	loader_color={'white|blue'} // optional
/>
*/