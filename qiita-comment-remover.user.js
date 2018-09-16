// ==UserScript==
// @name        qiita-comment-remover
// @namespace   chromia
// @description Qiitaの特定ユーザのコメントを見えなくする
// @match       https://qiita.com/*/items/*
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// @version     1
// @grant       none
// ==/UserScript==

//
// 説明
// ----
//
// Qiitaの記事に関するコメントのうち、特定のユーザが投稿したものを非表示にします。
//
// 非表示にするには、ユーザ名の隣の×をクリックします。
// 削除済の表示をダブルクリックすると再表示します。
//
//
// 連絡先
// ------
// chromia[at]outlook.jp ([at]を@に置換してください)
//

// オリジナルのソースコード
// togecutter-alt
// https://github.com/recyclebin5385/togecutter-alt/raw/master/togecutter-alt.user.js
// ライセンス文(修正BSDライセンス)
//
// Copyright (c) 2017, recyclebin5385
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
// * Neither the name of the <organization> nor the names of its contributors
//   may be used to endorse or promote products derived from this software
//   without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// 本スクリプトのライセンス(修正BSDライセンス, 派生元と同じ)
//
// Copyright (c) 2018, chromia
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
// * Neither the name of the <organization> nor the names of its contributors
//   may be used to endorse or promote products derived from this software
//   without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

//Cookieの名前
var cookieName = "qcr_hiddenCommentUserIds";


(function() {
    jQuery.noConflict();
    var $ = jQuery;

    //非表示ユーザーIDリストを格納したCookieの情報を取得する
    function getCookieMap() {
        var ret = new Array();

        var allCookies = document.cookie;
        if( allCookies != '' ) {
            var cookies = allCookies.split('; ');
            for (var i = 0; i < cookies.length; i++ ) {
                var cookie = cookies[i].split('=');

                // クッキーの名前をキーとして 配列に追加する
                ret[cookie[0]] = decodeURIComponent(cookie[1]);
            }
        }

        return ret;
    }

    //Cookieから非表示ユーザーIDリストを取得する
    function getHiddenUserIds() {
        var cookieMap = getCookieMap();
        var joinedHiddenUserIds = cookieMap[cookieName];
        if (joinedHiddenUserIds != null && joinedHiddenUserIds != '') {
            return joinedHiddenUserIds.split(' ');
        } else {
            return new Array();
        }
    }

    //非表示ユーザーIDリストをCookieに記録する
    function setHiddenUserIds(ids) {
        var now = new Date();
        var maxAgeDay = 366;
        now.setTime(now.getTime() + maxAgeDay * 24 * 60 * 60 * 1000);
        var expires = now.toGMTString();
        var path = "/";
        var cookie = cookieName + '=' + encodeURIComponent(ids.join(' ')) + ";expires=" + expires + ";path=" + path;

        if (cookie.length > 4096) {
            return false;
        }

        document.cookie = cookie;
        hideUsers();
        return true;
    }

    //非表示ユーザーリストに指定ユーザーを追加する
    function addHiddenUserId(id) {
        var ids = getHiddenUserIds();
        if ($.inArray(id, ids) == -1) {
            ids.push(id);
        }

        if (!setHiddenUserIds(ids)) {
            var deleted = 0;
            while (ids.length > 0) {
                ids.shift();
                deleted++;
                if (setHiddenUserIds(ids)) {
                    alert("容量オーバーのため古いIDを" + deleted + "件削除しました。");
                    return;
                }
            }
        }
    }

    //非表示ユーザーリストから指定ユーザーを削除する
    function removeHiddenUserId(id) {
        var ids = getHiddenUserIds();
        var newIds = [];
        for (var i = 0; i < ids.length; i++) {
            if (id != ids[i]) {
                newIds.push(ids[i]);
            }
        }
        setHiddenUserIds(newIds);
    }

    function getUserId(comment) {
        //コメントのcommentHeader_creatorのdiv要素を取得
        var creator = $(comment).find(".commentHeader_creator");
        //その直下にあるアンカーを取得し、href属性(href='/userid'みたいになってる)からIDを取り出す
        var idLinks = $(creator).children("a");
        if(idLinks.length == 0){
            return null;
        }else{
            var id = idLinks[0].getAttribute("href").replace(/\//, "");
            return id;
        }
    }

    //非表示ユーザーリストに含まれるユーザーのコメントを非表示にする
    function hideUsers() {
        var hiddenUserIds = getHiddenUserIds();

        //コメントの表示要素をピックアップ
        $(".commentList .comment").each(function(){
            var comment = $(this);
            //コメントの直下にあるHeaderとContentの要素を取得
            var header = $(comment).find(".commentHeader");
            var content = $(comment).find(".comment_content");
            //ユーザーIDを取得
            var id = getUserId(comment);
            if(id == null) return;
            console.log(id);

            //非表示ユーザーIDリストと照らし合わせる
            if ($.inArray(id, hiddenUserIds) != -1) {
                //入ってるので、コメント(のheaderとcontent)を非表示にする
                console.log("remove:", id);
                header.hide();
                content.hide();
                //その代わりに[削除済]表示を置く
                if (comment.find(".removed").length == 0) {
                    $("<div>[削除済]</div>")
                        .hide()
                        .addClass("removed")
                        .css({"cursor": "pointer", "padding-bottom": "0.5em"})

                        .attr("title", id)
                        .dblclick(function() {
                            if (confirm("このユーザを見えるようにしますか？")) {
                                removeHiddenUserId(id);
                            }
                        })
                        .appendTo(comment);
                }
                comment.find(".removed").show();
            } else {
                //入ってないのでコメントを表示する
                header.show();
                content.show();
                comment.find(".removed").hide();
            }
        });
    }

    //ユーザー名の横に、[x](削除)ボタンを配置
    $(function() {
        $(".commentList .comment").each(function(){
            var comment = $(this);
            //コメントのユーザー名の部分を取り出す
            var username = $(comment).find(".commentHeader_publicUrlName");
            //ユーザーIDを取得
            var id = getUserId(comment);
            if(id == null) return;

            //ユーザー名の横にボタンを追加
            $("<span>[×]</span>")
                .addClass("status_name")
                .css({"cursor": "pointer"})
                .attr("title", "このユーザのコメントを見えなくする")
                .click(function() {
                    if (confirm("このユーザを見えなくしますか？")) {
                        addHiddenUserId(id);
                    }
                    hideUsers();
                    return false;
                })
                .appendTo(username);
        });

        hideUsers();
    });
})();
