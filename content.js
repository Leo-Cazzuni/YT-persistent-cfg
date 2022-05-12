var initial_delay = 3000

// listener para msgs vindas do background para rodar o content script
if (window == top) {
    chrome.extension.onRequest.addListener((req, sender, sendResponse) =>{
        // console.log('YT persistent Cfg: Background request',req, sender, sendResponse)
        console.log('YT persistent Cfg: Background request')
        if (req.is_content_script)
            main()
            // sendResponse({is_content_script: true});
            sendResponse('Content script response');
    });
};

main()

// //========================================================================================
function main(){
    console.log('YT persistent Cfg: runing Content script')
    setTimeout(()=>{
        let YTcontroll = new YTdefaultCfg();
        YTcontroll.changeAllloop();
    },initial_delay);
}

class YTdefaultCfg{
    constructor(){
        this.windowNumber = this.getWindowNumber()

        this.checks_delay = 1000
        this.defaut_rez = 1080
        this.defaut_cc = false              // false = desativado
        this.defaut_autoplay = false        // false = desativado
        this.defaut_annotations = false;    // false = desativado
        
        this.ignore_ok = false               // ignore_ok = true: loop para apenas apos {max_checks} repeticoes
        this.max_checks = 5                 // ignore_ok = false: loop para apenas se checkAll()=true ou apos {max_checks} repeticoes
        this.loop_counter = 0

        this.available_rez = []
    }

    changeAll(){
        console.log('YT persistent Cfg: changeAll')

        this.changeCC()
        this.changeMenu(true)
        this.changeAutoPlay()

        if(!this.isMenuClosed()) this.toggleMenu()

        console.log('YT persistent Cfg:',this.checkAll()?'ALL ok':'NOT ok') 
    }

    changeAllloop(){
        console.log(`YT persistent Cfg: changeAllloop [${this.loop_counter}]`)

        this.changeAll()

        if(!this.checkAll() || this.ignore_ok){
            var checkloop = setInterval(()=>{
                this.loop_counter++
                console.log(`YT persistent Cfg: changeAllloop [${this.loop_counter}]`)

                this.changeCC()
                this.changeAutoPlay()
                this.changeMenu()

                if( (!this.ignore_ok && this.checkAll()) || this.loop_counter>=this.max_checks){
                    clearInterval(checkloop)
                    console.log('YT persistent Cfg: ',this.loop_counter>=this.max_checks?'ALL ok':'max check exceeded')  
                }

            },this.checks_delay)
        }
    }

    getWindowNumber(){
        try{
            document.querySelector("#ytp-id-18").getAttribute("style").includes('display: none')
            return '18'}
        catch{
            return '17'
        }
    }

    isMenuClosed(){
        var a = document.querySelector(`#ytp-id-${this.windowNumber}`) || document.querySelector("#ytp-id-17") || document.querySelector("#ytp-id-18")
        return a.getAttribute("style").includes('display: none')
    };

    toggleMenu(){
        document.querySelector('#movie_player button.ytp-settings-button').click()
    }

    changeAutoPlay(){
        var autoplayButton = document.querySelector("#movie_player div.ytp-right-controls > button:nth-child(1) > div > div")
        if (autoplayButton){
            var autoplay_is_pressed = autoplayButton.getAttribute("aria-checked")=='true'?true:false;
            if (autoplay_is_pressed != this.defaut_autoplay) autoplayButton.click()
        }
    }

    changeCC(){
        var ccButton = document.querySelector('#movie_player button.ytp-subtitles-button');
        if (ccButton){
            var cc_is_pressed = ccButton.getAttribute("aria-pressed")=='false'?false:true;  
            if (cc_is_pressed != this.defaut_cc) ccButton.click()
        } 
    }

    changeMenu(noCheckRez = false){
        var menuButton = document.querySelector('#movie_player button.ytp-settings-button');

        if(menuButton){
            menuButton.click()
            
            var menuItems = document.querySelectorAll(`#ytp-id-${this.windowNumber} .ytp-menuitem`)
            for(const item of menuItems){
                if (item.textContent.includes('Annotations') || item.textContent.includes('Anotações')) {
                    var annotations_is_pressed = item.getAttribute("aria-checked")=='false'?false:true;
                    if(annotations_is_pressed != this.defaut_annotations){
                        var annotationsButton = item.querySelector('.ytp-menuitem-content');
                        if (annotationsButton) annotationsButton.click()
                    }
                    continue;
                }
                else if (item.textContent.includes('Quality') || item.textContent.includes('Qualidade')) {
                    var curent_rez=Number(item.textContent.split('p')[0].replace(/\D/g, ""))
                    if (curent_rez != this.defaut_rez || noCheckRez) {
                        var qualityButton = item.querySelector('.ytp-menuitem-content');
                        qualityButton.click();

                        this.available_rez=[]
                        var rezItems = document.querySelectorAll(`#ytp-id-${this.windowNumber} > div > div.ytp-panel-menu > div`)
                        for(const item of rezItems) {
                            this.available_rez.push(Number(item.textContent.split('p')[0].replace(/\D/g, "")))
                            if (this.defaut_rez == item.textContent.split('p')[0].replace(/\D/g, "")) {
                                item.click();
                                break;
                            };
                        };

                    }
                    break;

                }
            }
            menuButton.click()
        }

        if(!this.isMenuClosed()) this.toggleMenu() // Só pra ter aquela certeza certeira
    }

    checkCC(){
        var ccButton = document.querySelector('#movie_player button.ytp-subtitles-button');
        if (ccButton){
            var cc_oculto = ccButton.getAttribute("style")
            var cc_unavailable = ccButton.getAttribute("aria-label")
            if (cc_unavailable!=null && (cc_unavailable.includes('unavailable') || cc_unavailable.includes('dispoíveis'))) return true
            if (cc_oculto==null || !cc_oculto.includes('display: none')) return String(this.defaut_cc) == ccButton.getAttribute("aria-pressed")            
        } 
        return true
    }

    checkAutoPlay(){
        var autoplayButton = document.querySelector("#movie_player div.ytp-right-controls > button:nth-child(1) > div > div")
        if (autoplayButton) return String(this.defaut_autoplay) == autoplayButton.getAttribute("aria-checked")
        return false // AutoPlay demora pra carregar mas sempre tem
    }

    checkMenu(){
        var menu_check = [true,true]

        var menuButton = document.querySelector('#movie_player button.ytp-settings-button');
        if(menuButton){
            menuButton.click()
            
            var menuItems = document.querySelectorAll(`#ytp-id-${this.windowNumber} .ytp-menuitem`)
            for(const item of menuItems){
                if (item.textContent.includes('Annotations') || item.textContent.includes('Anotações')) {
                    menu_check[0] = String(this.defaut_annotations) == item.getAttribute("aria-checked")                       
                    continue;
                }

                else if (item.textContent.includes('Quality') || item.textContent.includes('Qualidade')) {
                    menu_check[1] = this.defaut_rez ==  Number(item.textContent.split('p')[0].replace(/\D/g, ""))
                    continue;
                    // break;
                }
            }
            menuButton.click()
        }
        if(!this.isMenuClosed()) this.toggleMenu() // Só pra ter aquela certeza certeira

        // IMPORTANT: Caso a defaut_rez não esteja disponivel, muda-se a defaut_rez p/ a maior disponivel
        if(this.available_rez.length==0){
            console.log('available_rez.length==0')
            menu_check[1] = false
        }else if (!this.available_rez.includes(this.defaut_rez)){
            console.log('this.available_rez', this.available_rez)
            console.log('Math.max(this.available_rez)', Math.max(...this.available_rez))
            this.defaut_rez = Math.max(...this.available_rez)
            menu_check[1] = false 
        }

        return menu_check
    }

    // em changeMenu: tinnnha algo para fazer q eu esqueci (era um caso especial)

    checkAll(){
        var all_checks=[]
        all_checks.push(this.checkCC())
        all_checks.push(this.checkAutoPlay())
        all_checks.push.apply(all_checks, this.checkMenu())

        return all_checks.every(Boolean)
    }

}