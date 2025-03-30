function createTransport(data) {
    const transport = {};
    if (data.net && data.net !== 'tcp') {
        transport.type = data.net;
        if (data.path) transport.path = data.path;
        if (data.host) transport.headers = { Host: data.host };
    }
    return transport;
}

function createTransportFromParams(params) {
    const transport = {};
    const type = params.get('type');
    if (type && type !== 'tcp') {
        transport.type = type;
        if (params.get('path')) transport.path = params.get('path');
        if (params.get('host')) transport.headers = { Host: params.get('host') };
    }
    return transport;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function safeBtoa(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    return btoa(String.fromCharCode(...data));
}

function convertToVmess(outbound) {
    const { server, server_port, uuid, security, alter_id, transport, tls, tag } = outbound;
    if (!server || !server_port || !uuid) return null;

    const data = {
        v: "2",
        ps: tag || "vmess",
        add: server,
        port: server_port,
        id: uuid,
        aid: alter_id || 0,
        scy: security || "auto",
        net: transport?.type || "tcp",
        type: "none",
        host: transport?.headers?.Host || "",
        path: transport?.path || "",
        tls: tls?.enabled ? "tls" : "",
        sni: tls?.server_name || ""
    };

    const jsonStr = JSON.stringify(data);
    const base64Str = safeBtoa(jsonStr);
    return `vmess://${base64Str}`;
}

function convertToVless(outbound) {
    const { server, server_port, uuid, flow, transport, tls, tag } = outbound;
    if (!server || !server_port || !uuid) return null;

    const params = new URLSearchParams();
    if (flow) params.set('flow', flow);
    if (transport?.type) params.set('type', transport.type);
    if (transport?.path) params.set('path', transport.path);
    if (transport?.headers?.Host) params.set('host', transport.headers.Host);
    if (tls?.server_name) params.set('sni', tls.server_name);

    const url = `vless://${uuid}@${server}:${server_port}?${params.toString()}#${encodeURIComponent(tag || "vless")}`;
    return url;
}

function convertToTrojan(outbound) {
    const { server, server_port, password, transport, tls, tag } = outbound;
    if (!server || !server_port || !password) return null;

    const params = new URLSearchParams();
    if (transport?.type) params.set('type', transport.type);
    if (transport?.path) params.set('path', transport.path);
    if (tls?.server_name) params.set('sni', tls.server_name);
    if (tls?.alpn?.length) params.set('alpn', tls.alpn.join(','));

    const url = `trojan://${encodeURIComponent(password)}@${server}:${server_port}?${params.toString()}#${encodeURIComponent(tag || "trojan")}`;
    return url;
}

function convertToHysteria2(outbound) {
    const { server, server_port, password, tls, tag, obfs } = outbound;
    if (!server || !server_port) return null;

    const params = new URLSearchParams();
    if (tls?.server_name) params.set('sni', tls.server_name);
    if (tls?.insecure) params.set('insecure', '1');
    if (obfs?.type) params.set('obfs', obfs.type);
    if (obfs?.password) params.set('obfs-password', obfs.password);

    const url = `hysteria2://${encodeURIComponent(password || '')}@${server}:${server_port}/?${params.toString()}#${encodeURIComponent(tag || "hysteria2")}`;
    return url;
}

function convertToShadowsocks(outbound) {
    const { server, server_port, method, password, tag } = outbound;
    if (!server || !server_port || !method || !password) return null;

    const auth = safeBtoa(`${method}:${password}`);
    const url = `ss://${auth}@${server}:${server_port}#${encodeURIComponent(tag || "ss")}`;
    return url;
}

function generateTag(protocol, enableCustomTag, customTagName) {
    if (enableCustomTag && customTagName) {
        const count = (window[protocol + 'Count'] || 0) + 1;
        window[protocol + 'Count'] = count;
        return `${protocol}-${customTagName}-${count}`;
    } else {
        return `${protocol}-${generateUUID().slice(0, 8)}`;
    }
}