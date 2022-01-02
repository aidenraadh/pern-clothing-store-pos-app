import {useRef, useEffect} from 'react';

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

// export function confirmPopup(msg, trueCallback = null, falseCallback = null, callingComponent = null){
// 	let status = confirm(msg);
// 	if(status && trueCallback){
// 		trueCallback(callingComponent);
// 	}
// 	else if(!status && falseCallback){
// 		falseCallback(callingComponent);
// 	}	
// }

// export function promptPopup(msg, defaultValue, trueCallback = null, falseCallback = null, callingComponent = null){
// 	let input = prompt(msg, (defaultValue ? defaultValue : ''));
// 	if(input && trueCallback){
// 		trueCallback(input, callingComponent);
// 	}
// 	else if(!input && falseCallback){
// 		falseCallback(input, callingComponent);
// 	}	
// }

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

// export class MediaViewer extends React.Component{
//     constructor(props){
//         super(props);
//         this.state = {
//             shown: false,
//         };

//         this.toggleMediaViewer = this.toggleMediaViewer.bind(this);
//     }

//     generateMedia(){
//         switch(this.props.media.type){
//             case 'image': return (
//                 <img src={this.props.media.src} />
//             ); break;
//             default: return 'media type is invalid';
//         }
//     }

//     toggleMediaViewer(){
//         this.setState((state) => ({
//             shown: !(state.shown)
//         }));
//     }

//     componentDidMount(){
//         this.props.getToggleMediaViewer(
//             this.props.media_viewer_name,
//             this.toggleMediaViewer
//         );
//     }

//     render(){
//         const classes = (this.props.container_classes ? ' '+this.props.container_classes : '');

//         return (
//         <section id={this.props.media_viewer_name} className={
//             'media-viewer flex-row content-center items-center'+(this.state.shown ? ' shown' : '')+
//             classes
//             }
//             {...this.props.container_attr}
//         >
//             <button className="text-white"
//                 type="button" onClick={() => this.toggleMediaViewer(false)}
//             >
//                 &times;
//             </button>
//             <div className="media">
//                 {this.generateMedia()}
//             </div>
//         </section>
//         );
//     }
// }

/*

Example:

<MediaViewer
	media_viewer_name={'media_viewer_name'}
    getToggleMediaViewer={this.getToggleMediaViewer}
    media={{
        type: 'image|video|audio',
        // Add another media attributes
    }}
/>
*/

/*
	getToggleLDS(lds_name, toggle_lds){
		this.setState({
			[lds_name]: toggle_lds,
		});
	}
*/