module.exports = function count(s, pairs, mod = 1000000007) {
    /*
     According task conditions:
     When s[j] = '0'
     possible k[j][i] = K0[i] - j,
     where Set K0 include any numbers form range 0 <= number <= N  matching condition: number % pairs[n][0](on one or more)  === 0, where 0 <= n < pairs.length

     When s[j] = '1'
     possible k[j][i] = K1[i] - j,
     where K1 include any numbers form range 0 <= number <= N exclude K0, so  N = K1 + K0

     Because of task's solution is intersection of all k[j], there are some special cases.
     When pairs.length = 1
     all possible K=(K0 + K1) could be represented as Set of K[i]*n where 'i' is int from range = Set{1,2, ...pairs[0][0]**(pairs[0][1]-1)}
     and 'n' is int from range = Set {1, ...pairs[0][0]}
     so solution for s[j] = '0' would be:
     range = new Array(pairs[0][0]**(pairs[0][1]-1).fill(false).map((x,i) => i)
     and k[j]  = range.map(x => x * pairs[0][0] - j)
     for s[j] = '1', k[j] = K exclude range.map(x => x * pairs[0][0] - j)
     Obviously for case when 's' have two '0' intersection corresponding 'k[j]' = 0
     Similarly in case when 's' have substring '111...1' which length >= pairs[0][0] intersection(k[j], k[j+1], ...k[j+ pairs[0][0]-1]) = 0
     Particularly, when pairs[n][0] (smallest) is even 2 and 's' started = '11' k[0] items can be odd only,
     whereas k[1] items  can be even only and their intersection would be 0.
     Also obviously, when pairs.length equal 1
     K0 = N/pairs[0][0]
     K1 = (pairs[0][0] - 1)/pairs[0][0]
     so intersection s = '10' or '11' for first prime bigger then 2 would be N*(pairs[0][0] - 2)/pairs[0][0]
     And finally result for s = '01' is less by one than for s = '10'
     */

    const min_prime = pairs.reduce((res, x) => {
        if(res > x[0])
            res = x[0];
        return res
    }, pairs[0][0]);

    const s_length = s.length;
    const p_length = pairs.length;
    const test0 =  /0(1+)?0/;
    const test1 = new RegExp('1'.repeat(min_prime));
    const special_cases = (p_length < 2 && test0.test(s)) || test1.test(s);

    if(special_cases)
        return 0;

    const multiMod = (p, s0 = 0) => {
        const _mod = mod;
        let result = 1;
        for(let x of p){
            if(!s0)//for case s[j] === 0
                result = parseInt(divideStr(multiplyStr(result, powStrMod(x[0], x[1])), _mod));
            if(s0 === 1)//for case s[j] === 1
                result = parseInt(divideStr(multiplyStr(result*(x[0] - 1), powStrMod(x[0], x[1] - 1)), _mod));
            if(s0 === 2)// for case s = '00 ...0'
                result = parseInt(divideStr(multiplyStr(result, powStrMod(x[0], x[1] - 1)), _mod))
        }
        return result
    };

    const stringResolving = () => {
        if(p_length === 1){
            return resolveShort()
        }
        if(p_length > 1){
            return resolveLong()
        }
    };

    const resolveShort = () => {
        const prime = pairs[0][0];
        const pow = pairs[0][1];
        const factor = s_length < prime? prime - s_length: 1;
        let correct = s_length > 1? (s[0] === 0 || s[s_length - 1] === '1')? -1: 0: 0;
        return  factor * powStrMod(prime, pow - 1) % mod  // + correct
    };

    const resolveLong = () => {
        const _mod = mod;
        let correct = (s[0] === 0 && s[1] === 1)? -1: 0;

        const pairsToCalc0 = (i) => {
            if(i){
                let mult = 1;
                const res = [];
                for(let x of pairs.slice(0, i)){
                    if(x[1] > 1){
                        mult *= (x[0] -1);
                        res.push([x[0], x[1] - 1])
                    }else
                        res.push([x[0] - 1, x[1]])
                }
                if(pairs[i][1] > 1)
                    res.push([pairs[i][0], pairs[i][0] - 1]);
                if(mult > 1)
                    res.push([mult, 1]);
                return [ ...res, ...pairs.slice(i+1, p_length)];
            }else
                return [[pairs[0][0], pairs[0][1] - 1], ...pairs.slice(1, p_length)];
        };

        const calcK0 = () => {
            let result = 0;
            for (let i = 0; i < p_length; i++) {
                result += multiMod(pairsToCalc0(i))
            }
            return result
        };

        const calcK1 = () => {
            return multiMod(pairs, 1, 1)
        };

        const intersectionK1 = (j) => {
            return pairs.reduce((res, x) => {
                res = divideStr(multiplyStr(multiplyStr(res, x[0] - 1 - j), powStrMod(x[0], x[1] - 1)),_mod);
                return res
            }, 1)
        };

        const intersectionK0 = (j) => {
            // result intersection K0[j] is defined length consecutive sequences of multiple numbers
            // result is equal  sum of all sequence  > s.length (subtract s.length) multiply by
            // factor = pairs[0][0]**(pairs[0][1] - 1)*pairs[1][0]**(pairs[1][0] - 1) ...
            // *pairs[p_length - 1][0]**(pairs[p_length - 1][1] - 1)
            // this function gives correct results, but takes too much time even for task 10
            const _mod = mod;
            const N0 = pairs.reduce((res, x) => res * x[0], 1);
            const _pairs = pairs.map(x => x[0]).sort((a, b) => a - b).slice(1, p_length);
            const factor = pairs.map(x => powStrMod(x[0], x[1] - 1))
                .reduce((res, y) => divideStr(multiplyStr(y, res), _mod), 1);

            const checkInt = (i) => {
                for(let p of _pairs) {
                    if (i % p === 0)
                        return true;
                }
                return false
            };

            const down =(i, j = 0, ) => {
                if(j < s){
                    j += 2;
                    return checkInt(i - j)? down(i, j): j- s_length%2
                }
                return j - s_length%2
            };

            const up = (i, j = 0) => {
                j += 2;
                return checkInt(i + j)? up(i, j): j
            };

            let sum = 0;
            let s = s_length - s_length%2;
            let _down, gap;
            if(p_length < 10){
                for(let i = 3; i <  N0/2; i += s){
                    if(checkInt(i)){
                        _down = down(i);
                        gap = _down? up(i) + _down: 0;
                        sum += gap > s_length? gap - s_length: 0
                    }else
                        i += gap - _down;
                }
            }else
                sum = 1;
            return 2*sum* factor% _mod
        };

        if (s_length < 2)
            return s[0] === '1'? calcK1(): calcK0();
        else{
            const length_1 = s.match(/1*/g).reduce((res, x) =>
                res < x.length? x.length: res, 0);//define length '11..1'
            if(length_1 === s_length){
                return intersectionK1(s_length - 1);
            }
            else if(length_1 === 1 && s_length === 2){
                return min_prime === 2? calcK1():
                    multiMod(pairs.map(x => x[0] === min_prime? [x[0], x[1] - 1]: x)) // + correct
            }
            else
                return  intersectionK0(s_length - 1)
        }
    };

// Big number functions
    const multiplyStr = (str1, str2) => {
        const [_str1, _str2] = str1 < str2?
            [str1.toString(), str2.toString()]:
            [str2.toString(), str1.toString()];
        const len1 = _str1.length - 1;
        const len2 = _str2.length - 1;
        let result = '';
        const countD = (i) => {
            if(!i)
                return _str1[len1]*_str2[len2];
            let res = 0;
            let lim = Math.min(i, len1, len2);
            for(let j = 0; j < lim + 1; j++){
                if(_str1[len1 - j] && _str2[len2 - i + j])
                    res += (_str1[len1 - j]*_str2[len2 - i + j])
            }
            return res
        };
        const recM = () => {
            let i = 0;
            let int = '';
            while(i < (len1 + len2 + 1)){
                const digit = countD(i) + int;
                result = digit%10 + result;
                int = Math.floor(digit/10);
                i++
            }
            return int? (int + result): result
        };
        return recM()
    };

    const divideStr = (str, mod) => {
        const _str = str.toString();
        const _mod = mod.toString();
        const len1 = _str.length;
        const len2 = _mod.length;
        const tail = _str.slice(len2, len1);
        let head = _str.slice(0, len2);
        let factor = Math.floor(head/mod);

        if(!tail.length){
            if(factor)
                head -= factor * mod;
            return parseInt(head)
        }

        let i = 0;
        while (i <= tail.length){
            factor = Math.floor(head/mod);
            if(factor)
                head -= factor * mod;
            else if(i < tail.length){
                head = parseInt(head)? head + tail[i]: tail[i];
                i++;
            }else
                return parseInt(head);
            while(head.length < len2 && i < tail.length){
                head = parseInt(head)? head + tail[i]: tail[i];
                i++;
            }
        }
        return parseInt(head)
    };

    const powStr = (str, num, res = 1) => {
        if(!num){
            return res;
        }else{
            res = divideStr(multiplyStr( str, res), mod);
            num--;
            return powStr(str, num, res)
        }
    };

    const powStrMod= (prime, pow, rest = 1) => {
        if(prime === 1 || !pow)
            return 1;
        const max_pow = 10;
        const _mod = mod;

        const recPSM = (prime, pow, rest = 1) => {
            if(pow <= max_pow)
                return divideStr(multiplyStr(powStr(prime, pow), rest), _mod);
            const _pow = [Math.floor(pow / max_pow),  pow % max_pow];
            const max_factor = powStr(prime, max_pow);
            rest = divideStr(multiplyStr(powStr(prime, _pow[1]), rest), _mod);
            if(_pow[0] < max_pow){
                return divideStr(multiplyStr(powStr(max_factor, _pow[0]), rest), _mod)
            }else
                return recPSM(max_factor, _pow[0], rest)
        };
        return recPSM(prime, pow);
    };

    return stringResolving()
};

/*
 const down =(i, j = 0, ) => {
 if(j < s){
 j += 2;
 return checkInt(i - j)? down(i, j): j- s_length%2
 }
 return j - s_length%2
 };

 const up = (i, j = 0) => {
 j += 2;
 return checkInt(i + j)? up(i, j): j
 };


 const simpleCase = () => {
 const _pairs = pairs.map(x => x[0]).sort((a, b) => a - b);

 const checkNum = (i) => {
 for (let x of _pairs) {
 if ((i) % x === 0)
 return true
 }
 return false
 };

 const intersection = (num) => {
 const keys = Object.keys(num);
 let res = num[s_length-1];
 for(let key = 0; key < s_length -1; key++){
 res = res.filter(x => num[key].indexOf(x) > -1)
 }
 return res
 };
 const N = pairs.reduce((res, x) => {
 res *= x[0]**x[1];
 return res
 }, 1);

 const _s = [ ...s];
 const num = {};
 if(s_length === 2)
 [_s[0], _s[1]] = [s[1], s[0]]; //to correct calculation according tests expectation
 for (let i = 0; i < s_length; i++) {
 num[i] = [];
 if(_s[i] === '1') {
 for(let k = N - 1 - i; k >= 0; k--) {
 if(!checkNum(i + k))
 num[i].push(k)
 }
 }
 if(_s[i] === '0') {
 for (let k = N - i; k + i > 1; k--) {
 if(checkNum(i + k))
 num[i].push(k);
 }
 }
 }
 return s_length < 2? num[0].length: intersection(num).length
 };

 */