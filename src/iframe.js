/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2018, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
import EventHandler from './event-handler.js';

let refNumbers = 0;

export class IFrame extends EventHandler {
  constructor(options = {}) {
    super('IFrame');

    this.wid = -1;
    this.callbacks = [];
    this.options = Object.assign({
      targetOrigin: '*'
    }, options || {});

    window.addEventListener('message', ({data}) => {
      if (data.__osjs_message === 'message') {
        const refNum = data.__osjs_reference;
        if (refNum >= 0) {
          const found = this.callbacks.find(iter => iter.refNum === refNum);
          if (found) {
            found.callback(data.payload);
          } else {
            console.warn('A message expecting a callback was found... but lost :(', data);
          }
        } else {
          this.emit('message', data.payload);
        }
      } else if (data.__osjs_message === 'handshake') {
        this.wid = data.payload;
        this.emit('osjs:init', this.wid);
      }
    });
  }

  send(payload, callback) {
    if (this.wid < 0) {
      throw new Error('IFrame is not ready, cannot send payload to OS.js');
    }

    let refNum = -1;
    if (typeof callback === 'function') {
      refNum = ++refNumbers;

      this.callbacks.push({refNum, callback});
    }

    top.postMessage({
      __osjs_window: this.wid,
      __osjs_reference: refNum,
      payload
    }, this.options.targetOrigin);
  }
}
