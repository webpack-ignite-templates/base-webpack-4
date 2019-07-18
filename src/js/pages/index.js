import '../../assets/scss/foundation/foundation_base.scss';
import '../../assets/scss/layout.scss';
import '../../assets/scss/index.scss';

if (module.hot) {
    require(`../../index.ejs`);

    module.hot.accept(`../../index.ejs`, ()=>{
        window.console.info("HTML has been updated, reloading!")
        window.location.reload();
    });

    module.hot.accept();
  }