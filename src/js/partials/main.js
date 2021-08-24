window.addEventListener('load', () => {
  let data = null;
  let maxVal = 0;
  let sectorsKeys = [];
  let fp = null;

  const mediaList = window.matchMedia('(max-width: 767px)');

  const moveDown = document.querySelector('.__js_move-down');
  const showResultBtn = document.querySelector('.__js_show-result');
  const groups = document.querySelectorAll('g[data-id]');
  const resultSection = document.querySelector('.__js_result-section');
  const resultSectionContent = resultSection.querySelector('.result-section__content');


  fullpageInit();

  document.querySelectorAll('.wheel path').forEach(it => {
    it.onclick = function () {
      
      const thisId = parseInt(this.dataset.id, 10)
      this.parentElement.dataset.chosen = thisId;

      let tempMax = 0;
			for (g of groups) {
				if (tempMax < parseInt(g.dataset.chosen)) tempMax = parseInt(g.dataset.chosen);
			}
			maxVal = tempMax;
    
    }
  })



  moveDown.onclick = e => {
    e.preventDefault();
    fullpage_api.moveSectionDown();
  };

  groups.forEach(it => {
    it.addEventListener('mouseleave', onGroupMouseleave);
    it.addEventListener('mouseenter', onGroupMouseenter);
  });
  
  fetch('js/data.json').then(response => response.json()).then(d => {
    data = d;

    showResultBtn.addEventListener('click', e => {
      e.preventDefault();

      Array.from(groups).filter(it => parseInt(it.dataset.chosen, 10) !== 0 && parseInt(it.dataset.chosen, 10) === maxVal).forEach(it => sectorsKeys.push(it.dataset.id));

      const isAllSelected = checkAllSelected();

      if (isAllSelected) {
        showResult();
      } else {
        new Modal();
        
        document.addEventListener('modal-close', () => {
          changeAllowScrolling(true, 'all');
        });
        changeAllowScrolling(false, 'all');
      }
    });

  });

  function checkAllSelected() {
    return Array.from(groups).every(it => it.dataset.chosen != 0);
  }

  function showResult() {
    if (sectorsKeys.length) {
      const key = sectorsKeys.pop();

      if (resultSection.classList.contains('invisible')) {
        resultSection.classList.remove('invisible');
        fillWithContent();

        if (mediaList.matches) {
          document.querySelector('.section--second .section__container').classList.add('hide');
        }
          fullpage_api.reBuild();

      } else {
        resultSectionContent.ontransitionend = () => {
          fillWithContent();
          resultSectionContent.ontransitionend = null;
          resultSectionContent.classList.remove('invisible');
          fullpage_api.reBuild();
        }
        resultSectionContent.classList.add('invisible');

        
      }

      changeAllowScrolling(false, 'up');

      function fillWithContent() {
        resultSection.querySelector('.result-section__title').textContent = data[key].title;
        resultSection.querySelector('.__js_result-desc').innerHTML = data[key].content.description;
        resultSection.querySelector('.__js_result-expert').innerHTML = data[key].content.expert;

        resultSection.querySelector('.__js_retry').onclick = resetResult;
        const moreBtn = resultSection.querySelector('.__js_more');

        if (sectorsKeys.length) {
          moreBtn.onclick = showResult;
          moreBtn.classList.remove('hide');
        } else {
          moreBtn.classList.add('hide');
        }
      }
    }

  }

  function resetResult() {
    sectorsKeys = [];
    
    for (g of groups) {
      g.dataset.chosen = 0;

      for (path of g.children) {
        path.setAttribute('fill', 'rgba(255,255,255,0.001)');
      }
    }

    resultSection.classList.add('invisible');
    changeAllowScrolling(true, 'up');

    if (mediaList.matches) {
      document.querySelector('.section--second .section__container').classList.remove('hide');
      fullpage_api.reBuild();
    }
  }


  function onPathMouseenter() {
    const currentId = parseInt(this.dataset.id, 10);
    const color = this.parentElement.dataset.fill;

    /*this.onclick = () => {
      const thisId = parseInt(this.dataset.id, 10)
      this.parentElement.dataset.chosen = thisId;

      let tempMax = 0;
			for (g of groups) {
				if (tempMax < parseInt(g.dataset.chosen)) tempMax = parseInt(g.dataset.chosen);
			}
			maxVal = tempMax;
    }*/

    Array.from(this.parentElement.children).forEach((it, index) => {
      const fill = index > currentId - 1 ? 'rgba(255,255,255,0.001)' : color;
      it.setAttribute('fill', fill);
    })
  }

  function onGroupMouseleave() {
    const comleteId = parseInt(this.dataset.chosen, 10);

    Array.from(this.children).forEach((it, index) => {
      const fill = index > comleteId - 1 ? 'rgba(255,255,255,0.001)' : this.dataset.fill;
      it.setAttribute('fill', fill);
      
      it.onmouseenter = null;
    })

    //console.dir(this.parentElement.dataset.fill)
  }
  
  function onGroupMouseenter() {
    const comleteId = parseInt(this.dataset.chosen, 10);

    Array.from(this.children).forEach((it, index) => {
      //const fill = index > comleteId - 1 ? 'none' : this.dataset.fill;
      //it.setAttribute('fill', fill);

      it.onmouseenter = onPathMouseenter;
    })

    //console.dir(this.parentElement.dataset.fill)
  }

  function fullpageInit() {
    fp = new fullpage('#fullpage', {
      licenseKey: '930B3D8E-64114A48-BE58EB40-E2698A87',
      verticalCentered: false,
      scrollOverflow: true,
    });
  }

  function changeAllowScrolling(bool, direction) {
    fullpage_api.setAllowScrolling(bool, direction);
    fullpage_api.setKeyboardScrolling(bool, direction);
  }

  window.fillPath = () => {
    maxVal = 10;
    const paths = document.querySelector('.wheel').querySelectorAll('path');

    for (p of paths) {
      p.setAttribute('fill', p.parentElement.dataset.fill);
    }
    for (g of groups) {
      g.dataset.chosen = 10;
    }
  }

  class Modal {
    constructor() {
      this.el = document.createElement('div');
      this.el.classList.add('modal');
      this.el.addEventListener('click', this.onModalClick);
      this.render();
      document.body.append(this.el);
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', this.onKeydown);
    }
    
    render = () => {
      const btn = document.querySelector('.__js_show-result');
      let message = 'Для просмотра результата необходимо заполнить все секторы.';

      if (btn && btn.dataset.modalText) {
        message = btn.dataset.modalText;
      }

      this.el.innerHTML = `
        <div class="modal__inner">
          <button class="modal__close">[x]</button>
          <div class="modal__message">
            ${message}
          </div>
        </div>`;
    }

    close = () => {
      this.el.remove();
      
      document.body.classList.remove('modal-open');

      const event = new CustomEvent('modal-close', {
        detail: 'close',
        bubbles: true
      });
      document.dispatchEvent(event);
    }

    onModalClick = (e) => {
      const target = e.target;

      if (target.closest('.modal__close') || target.closest('.modal') && !target.closest('.modal__inner') && document.body.classList.contains('modal-open')) {
        this.close();
      }
    }

    onKeydown = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', this.onKeydown);
      }
    }
  }
});