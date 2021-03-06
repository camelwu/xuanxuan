import React, {Component, PropTypes} from 'react';
import Platform from 'Platform';
import HTML from '../../utils/html-helper';
import App from '../../core';
import Lang from '../../lang';
import Emojione from '../../components/emojione';
import Icon from '../../components/icon';
import API from '../../network/api';
import Avatar from '../../components/avatar';
import ImageViewer from '../../components/image-viewer';

const isBrowser = Platform.type === 'browser';

class MessageContentImageView extends Component {
    static propTypes = {
        className: PropTypes.string,
        message: PropTypes.object.isRequired,
    };

    static defaultProps = {
        className: null,
    };

    constructor(props) {
        super(props);
        this.state = {
            download: false,
            url: ''
        };
        if (isBrowser) {
            const {message} = this.props;
            const image = message.imageContent;
            this.state.url = API.createFileDownloadUrl(App.user, image);
        }
    }


    componentDidMount() {
        const {message} = this.props;
        const image = message.imageContent;
        if (!this.state.url && image.id && image.send === true) {
            this.downloadImage(image);
        }
    }
    componentDidUpdate() {
        this.componentDidMount();
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    downloadImage(image) {
        if (this.state.download === false || this.state.download === true) {
            API.downloadFile(App.user, image, progress => {
                if (this.unmounted) return;
                this.setState({download: progress});
            }).then(file => {
                if (this.unmounted) return;
                this.setState({url: image.src});
                this.setState({download: true});
            }).catch(error => {
                if (this.unmounted) return;
                this.setState({download: false});
            });
        }
    }

    handleImageContextMenu(url, dataType, e) {
        const items = App.ui.createImageContextMenuItems(url, dataType);
        App.ui.showContextMenu({x: e.pageX, y: e.pageY}, items);
        e.preventDefault();
    }

    render() {
        const {
            message,
            className,
            ...other
        } = this.props;

        const image = message.imageContent;

        if (image.type === 'emoji') {
            return (<div
                {...other}
                className={HTML.classes(' emojione-hd', className)}
                dangerouslySetInnerHTML={{__html: Emojione.toImage(image.content)}}
            />);
        }
        if (image.type === 'base64') {
            return (<img
                onContextMenu={isBrowser ? null : this.handleImageContextMenu.bind(this, image.content, image.type)}
                data-fail={Lang.string('file.downloadFailed')}
                onError={e => e.target.classList.add('broken')}
                onDoubleClick={ImageViewer.show.bind(this, image.content, null, null)}
                src={image.content}
                alt={image.type}
            />);
        }
        if (image.id && image.send === true) {
            if (this.state.url) {
                return (<img
                    onContextMenu={isBrowser ? null : this.handleImageContextMenu.bind(this, this.state.url, '')}
                    title={image.name}
                    alt={image.name}
                    data-fail={Lang.string('file.downloadFailed')}
                    onError={e => e.target.classList.add('broken')}
                    onDoubleClick={ImageViewer.show.bind(this, this.state.url, null, null)}
                    src={this.state.url}
                />);
            } else if (typeof this.state.download === 'number') {
                const percent = Math.floor(this.state.download);
                return (<Avatar
                    className="avatar-xl info-pale text-info app-message-image-placeholder"
                    icon="image-area"
                >
                    <div className="space-sm" />
                    <div className="label info circle"><Icon name="download" /> {percent}%</div>
                </Avatar>);
            }
        }
        if (typeof image.send === 'number') {
            const percent = Math.floor(image.send);
            return (<Avatar className="avatar-xl info-pale text-info app-message-image-placeholder" icon="image-area">
                <div className="space-sm" />
                <div className="label info circle"><Icon name="upload" /> {percent}%</div>
            </Avatar>);
        }
        return (<Avatar className="avatar-xl warning-pale text-warning app-message-image-placeholder" icon="image-broken">
            <div className="space-xs" />
            <div className="label clean circle">{Lang.string('file.uploadFailed')}</div>
        </Avatar>);
    }
}

export default MessageContentImageView;
