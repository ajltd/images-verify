import axios from 'axios';
import Promise from 'bluebird';
import prettyBytes from 'pretty-bytes';
import * as xml2js from 'xml2js';
const instance = axios.create();
const config = { headers: {'Content-Type': 'text/xml'} };
async function run() {
    let totalImages = 0;
    let failures = 0;
    let successes = 0;
    const response = await instance.get('https://extensionsell.com/app/xml/export2.php?shop=antique-jewellers-ltd', config);
    const products = (await xml2js.parseStringPromise(response.data, {trim: true})).items.item;
    console.log(`${products.length} Products in feed`);
    for (const product of products) {
        const images = product.images[0].image;
        console.log(`${product.id} - ${images.length} Images`);
        await Promise.map(images, async image => {
            totalImages += 1;
            try {
                const fetched = await axios.get(image, {responseType: 'arraybuffer'});
                if (response.status !== 200) {
                    throw new Error(`Non-200 error code. Code was ${response.status}`);
                }
                const buffer = Buffer.from(fetched.data, 'binary');
                console.log(`${image} fetched with status code ${response.status}, file size ${prettyBytes(Buffer.byteLength(buffer))}`);
                successes += 1;

            } catch (e) {
                console.log(`Failed to get image ${image}`);
                console.error(e);
                failures += 1;
            }
        });
    }
    console.log(`${totalImages} Total Images`)
    console.log(`${successes} Succeeded with 200 code`)
    console.log(`${failures} Failures`)
}
run();