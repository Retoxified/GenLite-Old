/*
    Copyright (C) 2022 Retoxified
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

export class GenLiteConfirmation {
    static async confirm(message: string) {
        return window.confirm(message);
    }

    static confirmModal(message: string[], callback: () => void) {
        let bg = document.createElement('div');
        bg.style.height = '100%';
        bg.style.width = '100%';
        bg.style.position = 'absolute';
        bg.style.left = '0';
        bg.style.top = '0';
        bg.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        bg.style.zIndex = '1000';
        bg.style.backdropFilter = 'blur(5px)';
        document.body.appendChild(bg);

        let modal = document.createElement('div');
        modal.id = 'genlite-confirm-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.width = '40%';
        modal.style.transform = 'translate(-50%, -50%)';
        bg.appendChild(modal);

        let header = document.createElement('div');
        header.id = 'genlite-confirm-header';
        header.style.backgroundImage = 'url("https://genfanad-static.s3.us-east-2.amazonaws.com/versioned/0.120/data_client/img/new_ux/login_screen_images/generic_modal_top.png")';
        header.style.backgroundSize = '100%, 100%';
        header.style.width = '100%';
        header.style.aspectRatio = '2106/310'; // background png size
        modal.appendChild(header);

        let title = document.createElement('div');
        title.style.backgroundImage = 'url("https://genfanad-static.s3.us-east-2.amazonaws.com/versioned/0.120/data_client/img/new_ux/login_screen_images/modal_title.png")';
        title.style.position = 'fixed';
        title.style.width = '40%';
        title.style.aspectRatio = '632/120';
        title.style.backgroundSize = '100%, 100%';
        title.style.top = '0';
        title.style.left = '50%';
        title.style.transform = 'translate(-50%, -25%)';
        title.style.textAlign = 'center';
        title.style.textShadow = '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000';
        title.style.fontFamily = 'acme,times new roman,Times,serif';
        title.style.fontSize = '1.5rem';
        title.style.color = 'white';
        title.style.overflow = 'hidden';

        title.style.display = 'flex';
        title.style.justifyContent = 'center';
        title.style.alignContent = 'center';
        title.style.flexDirection = 'column';

        title.innerText = 'GenLite Warning';
        header.appendChild(title);

        let body = document.createElement('div');
        body.id = 'genlite-confirm-body';
        body.style.backgroundImage = 'url("https://genfanad-static.s3.us-east-2.amazonaws.com/versioned/0.120/data_client/img/new_ux/login_screen_images/generic_modal_mid_and_bottom.png")';
        body.style.backgroundSize = '100%, 100%';
        body.style.width = '100%';
        body.style.aspectRatio = '2104/1316'; // background png size

        body.style.textAlign = 'center';
        body.style.textShadow = '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000';
        body.style.fontFamily = 'acme,times new roman,Times,serif';
        body.style.fontSize = '1.5rem';
        body.style.color = 'white';
        modal.appendChild(body);

        let scrollBox = document.createElement('div');
        scrollBox.style.width = '90%';
        scrollBox.style.height = '75%';
        scrollBox.style.margin = 'auto';
        scrollBox.style.overflowY = 'scroll';
        body.appendChild(scrollBox);

        let list = document.createElement('ul');
        list.style.marginTop = '0';
        list.style.paddingTop = '0';
        list.style.paddingLeft = '4em';
        list.style.paddingRight = '3em';
        list.style.paddingBottom = '1em';
        list.style.textAlign = 'left';
        for (const item of message) {
            let li = document.createElement('li');
            li.innerText = item;
            list.appendChild(li);
        }
        scrollBox.appendChild(list);

        let confirmText = document.createElement('span');
        confirmText.style.display = 'inline-block';
        confirmText.style.width = '75%';
        confirmText.style.textAlign = 'center';
        confirmText.style.paddingBottom = '2em';
        confirmText.innerText = 'Press Cancel to continue, Press Okay to disable GenLite';
        scrollBox.appendChild(confirmText);

        // okay button actually cancels genlite
        let okayButton = document.createElement('div');
        okayButton.style.backgroundImage = 'url("https://genfanad-static.s3.us-east-2.amazonaws.com/versioned/0.120/data_client/img/new_ux/login_screen_images/return_button.png")';
        okayButton.style.backgroundSize = '100%, 100%';
        okayButton.style.width = '15%';
        okayButton.style.aspectRatio = '131/52'; // background png size
        okayButton.style.position = 'fixed';
        okayButton.style.top = '100%';
        okayButton.style.left = '40%';
        okayButton.style.transform = 'translate(-50%, -175%)';

        okayButton.style.display = 'flex';
        okayButton.style.justifyContent = 'center';
        okayButton.style.alignContent = 'center';
        okayButton.style.flexDirection = 'column';
        okayButton.style.cursor = 'pointer';
        okayButton.innerText = 'Okay';
        okayButton.onclick = (e) => {
            bg.remove();
        };
        scrollBox.appendChild(okayButton);

        // cancel button is actually the accept button
        let cancelButton = document.createElement('div');
        cancelButton.style.backgroundImage = 'url("https://genfanad-static.s3.us-east-2.amazonaws.com/versioned/0.120/data_client/img/new_ux/crafting/crafting_2/make_all.png")';
        cancelButton.style.backgroundSize = '100%, 100%';
        cancelButton.style.width = '15%';
        cancelButton.style.aspectRatio = '188/72'; // background png size
        cancelButton.style.position = 'fixed';
        cancelButton.style.top = '100%';
        cancelButton.style.left = '60%';
        cancelButton.style.transform = 'translate(-50%, -175%)';

        cancelButton.style.display = 'flex';
        cancelButton.style.justifyContent = 'center';
        cancelButton.style.alignContent = 'center';
        cancelButton.style.flexDirection = 'column';
        cancelButton.style.cursor = 'pointer';
        cancelButton.innerText = 'Cancel';
        cancelButton.onclick = (e) => {
            bg.remove();
            callback();
        };
        scrollBox.appendChild(cancelButton);

        return false;
    }
}
