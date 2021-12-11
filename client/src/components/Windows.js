import React from 'react';

export class Modal extends React.Component{
    constructor(props){
        super(props);
        this.modalRef = React.createRef();
    }

    componentDidUpdate(prevProps){
        if(prevProps.modalShown !== this.props.modalShown){
            const modal = this.modalRef.current;
            let modalOverlay = modal.children[0];
            let modalContent = modalOverlay.children[0];

            if(this.props.modalShown){
                modal.classList.add('shown');
                modalOverlay.addEventListener('transitionend', () => {
                    modalContent.classList.add('shown');
                }, {once: true});                
            }
            else{
                modalContent.classList.remove('shown');
                modalContent.addEventListener('transitionend', function(){
                    modal.classList.remove('shown');
                }, {once: true});                
            }
        }
    }

    render(){
        const classes = (this.props.classes ? ' '+this.props.classes : '');
        return (<>
      		<section className={'modal'+classes} ref={this.modalRef} {...this.props.attr}>
      			<div className="overlay">
      				<div className="modal-content">
      				  	<div className="modal-header">
      				  	  	<h6 className='heading text-medium text-dark-75'>
                                {this.props.heading}
                            </h6>
      				  	  	<button className="cls-modal text-blue" type="button"
                            onClick={this.props.toggleModal}>
                                &times;
                            </button>
      				  	</div>
      				  	<div className="modal-body">
      				  		{this.props.body}
      				  	</div>
      				  	<div className={'modal-footer '+(this.props.footer_align ?
                        'align-'+this.props.footer_align: '')}>
                            {this.props.footer}
                        </div>
      				</div>  		
      			</div>          	
      		</section>
        </>);
    }
}

/*
Example:

<Modal
	heading = {'Modal Heading'}
	body = {<p>Modal body</p>}
    toggleModal = {this.toggleModal} // The modal togglers from parent component
    modalShown = {this.state.modalShown} // Boolean, modal shown status from parent component
    footer={'Modal footer'} // optional
    footer_align={'left'|'center'|'right'} // optional
/>

The toggleModal function from parent component would look like this:
toggleModal(){
    this.setState((state) => ({modalShown: !state.modalShown}));
}
*/

export function confirmPopup(msg, trueCallback = null, falseCallback = null, callingComponent = null){
	let status = confirm(msg);
	if(status && trueCallback){
		trueCallback(callingComponent);
	}
	else if(!status && falseCallback){
		falseCallback(callingComponent);
	}	
}

export function promptPopup(msg, defaultValue, trueCallback = null, falseCallback = null, callingComponent = null){
	let input = prompt(msg, (defaultValue ? defaultValue : ''));
	if(input && trueCallback){
		trueCallback(input, callingComponent);
	}
	else if(!input && falseCallback){
		falseCallback(input, callingComponent);
	}	
}

export class LoadingScreen extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            visibility: false,
            shown: false,
        };

        this.toggleLDS = this.toggleLDS.bind(this);
        this.concealLDS = this.concealLDS.bind(this);

    }

    toggleLDS(show_lds){
        if(show_lds){
            this.setState({
                visibility: true,
                shown: true,
            });
        }
        else{
            this.setState({ shown: false });
        }
    }

    concealLDS(){
        if(!this.state.shown){
            this.setState({ visibility: false });
        }
    }

    componentDidUpdate(prevProps){
        if(prevProps.lds_shown !== this.props.lds_shown){
            this.toggleLDS(this.props.lds_shown);
        }
    }

    render(){
        const visibility = (this.state.visibility ? ' visible' : '');
        const shown = (this.state.shown ? ' shown' : '');
        const loader_color = (this.props.loader_color ? ' '+this.props.loader_color : ' white');
        const overlay = (this.props.overlay ? ' '+this.props.overlay+'-overlay' : ' dark-overlay');

        return (<>
            <div className={'loading-screen'+overlay+visibility+shown}
            aria-hidden="true" onTransitionEnd={this.concealLDS}>
        	    {(this.props.loading_text ? 
                <span className="loading-text">{this.props.loading_text}</span> : ''
                )}
            	<div className={"lds-ripple"+loader_color}>
            		<div></div>
            		<div></div>
            	</div>	
            </div>
        </>);
    }
}

/*

Example:

<LoadingScreen
    lds_shown={this.state.lds_shown} // Boolean
	overlay={'dark|transparent'} // optional
	loading_text={'Please wait...'} // optional
	loader_color={'white|blue'} // optional
/>
*/

export class MediaViewer extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            shown: false,
        };

        this.toggleMediaViewer = this.toggleMediaViewer.bind(this);
    }

    generateMedia(){
        switch(this.props.media.type){
            case 'image': return (
                <img src={this.props.media.src} />
            ); break;
            default: return 'media type is invalid';
        }
    }

    toggleMediaViewer(){
        this.setState((state) => ({
            shown: !(state.shown)
        }));
    }

    componentDidMount(){
        this.props.getToggleMediaViewer(
            this.props.media_viewer_name,
            this.toggleMediaViewer
        );
    }

    render(){
        const classes = (this.props.container_classes ? ' '+this.props.container_classes : '');

        return (
        <section id={this.props.media_viewer_name} className={
            'media-viewer flex-row content-center items-center'+(this.state.shown ? ' shown' : '')+
            classes
            }
            {...this.props.container_attr}
        >
            <button className="text-white"
                type="button" onClick={() => this.toggleMediaViewer(false)}
            >
                &times;
            </button>
            <div className="media">
                {this.generateMedia()}
            </div>
        </section>
        );
    }
}

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